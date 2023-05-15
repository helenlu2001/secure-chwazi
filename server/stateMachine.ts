import {RawEntry, TransactionLog} from "./log";
import * as assert from "assert";
import {KeyPair, Proof} from "./vrf";
import {proposeTransaction} from "./chwazi";

class Phase1 {
    private participants: Map<string, number> = new Map<string, number>([]);
    constructor(private readonly keys: KeyPair, private readonly log: TransactionLog, private readonly waitingOn: Set<string>) {}

    addParticipant(name: string, amount: number): Phase1 | Phase2 {
        this.waitingOn.delete(name);
        this.participants = this.participants.set(name, amount);

        if (this.waitingOn.size === 0) {
            return new Phase2(this.participants, this.keys, this.log);
        }

        return this;
    }
}

class Phase2 {
    private readonly confirmed: Set<string> = new Set<string>();
    constructor(private readonly participants: Map<string, number>, private readonly keys: KeyPair, private readonly log: TransactionLog) {}

    confirm(name: string): Phase3 | Phase2 {
        console.log("participants", this.participants);
        console.log("name", name);
        assert.ok(this.participants.has(name));
        this.confirmed.add(name);

        const allConfirmed = Array.from(this.participants).reduce((a, [p, _]) => a && this.confirmed.has(p), true);
        if (allConfirmed) {
            return new Phase3(this.participants, this.keys, this.log);
        } else {
            return this;
        }
    }

    reject(): Aborted {
        return new Aborted();
    }

    get bill(): ReadonlyMap<string, number> {
        return this.participants;
    }

    get txnCounts(): ReadonlyMap<string, number> {
        return this.log.get(this.log.size - 1)?.payments.counts ?? new Map<string, number>();
    }
}

class Phase3 {
    private readonly proposedEntry: RawEntry;
    private readonly proposedChoice: string;
    private readonly confirmed: Set<string> = new Set<string>();
    constructor(participants: Map<string, number>, private readonly keys: KeyPair, private readonly log: TransactionLog) {
        const { entry, choice } = proposeTransaction({ participants }, keys.secretKey, log);
        this.proposedEntry = entry;
        this.proposedChoice = choice;
    }

    confirm(name: string): Accepted | Phase3 {
        assert.ok(this.proposedEntry.participants.has(name));
        this.confirmed.add(name);

        const allConfirmed = Array.from(this.proposedEntry.participants).reduce((a, [p, _]) => a && this.confirmed.has(p), true);
        if (allConfirmed) {
            return new Accepted(this.proposedEntry, this.log);
        } else {
            return this;
        }
    }

    reject(): Aborted {
        return new Aborted();
    }

    get choice(): string {
        return this.proposedChoice;
    }

    get entry(): RawEntry {
        return this.proposedEntry;
    }
}

class Accepted {
    constructor(rawEntry: RawEntry, log: TransactionLog) { log.add(rawEntry); }
}

class Aborted {}

class StateMachine {
    private state: Phase1 | Phase2 | Phase3 | Accepted | Aborted;
    constructor(keys: KeyPair, log: TransactionLog, allUsers: Set<string>) {
        this.state = new Phase1(keys, log, allUsers);
    }

    addParticipant(name: string, amount: number): boolean {
        if (!(this.state instanceof Phase1)) {
            throw new Error("Wrong phase for addParticipant, must be in phase 1!");
        }

        this.state = this.state.addParticipant(name, amount);
        return this.state instanceof Phase2;
    }

    p2Confirm(name: string): boolean {
        if (!(this.state instanceof Phase2)) {
            throw new Error("Wrong phase for p2Confirm, must be in phase 2!");
        }

        this.state = this.state.confirm(name);
        return this.state instanceof Phase3;
    }

    p2Reject(): boolean {
        if (!(this.state instanceof Phase2)) {
            throw new Error("Wrong phase for p2Reject, must be in phase 2!");
        }

        this.state = this.state.reject();
        return true;
    }

    p3Confirm(name: string): boolean {
        if (!(this.state instanceof Phase3)) {
            throw new Error("Wrong phase for p3Confirm, must be in phase 3!");
        }

        this.state = this.state.confirm(name);
        return this.state instanceof Accepted;
    }

    p3Reject(): boolean {
        if (!(this.state instanceof Phase3)) {
            throw new Error("Wrong phase for p3Reject, must be in phase 3!");
        }

        this.state = this.state.reject();
        return true;
    }

    get aborted(): boolean {
        return this.state instanceof Aborted;
    }

    get accepted(): boolean {
        return this.state instanceof Accepted;
    }

    get inProgress(): boolean {
        return !this.accepted && !this.aborted;
    }

    get inner(): Phase1 | Phase2 | Phase3 | Accepted | Aborted {
        return this.state;
    }
}

export type Event = { ty: "p1Add", name: string, amount: number }
| { ty: "p2Confirm", name: string }
| { ty: "p2Reject" }
| { ty: "p3Confirm", name: string }
| { ty: "p3Reject" }

export type Response = { ty: "pending" }
| { ty: "p1Response", bill: Array<[string, number]>, counts: Array<[string, number]> }
| { ty: "p2Response", choice: string, entry: RawEntry }
| { ty: "p3Response" }
| { ty: "rejected" }
| { ty: "err", err: string }


export class EventInterpreter {
    private readonly sm: StateMachine;
    private responseToBroadcast: Response | null = null;
    constructor(keys: KeyPair, log: TransactionLog, allUsers: Set<string>) {
        this.sm = new StateMachine(keys, log, allUsers);
    }

    /**
     * Interpret the provided event as a state machine command, propagating errors and providing a corresponding response
     * if the event causes a phase change.
     *
     * @param ev the event to interpret
     * @returns the result of handling the given event
     */
    public handleEvent(ev: Event): Response {
        try {
            let changed;
            switch (ev.ty) {
                case "p1Add":
                    console.log("in p1Add case!");
                    changed = this.sm.addParticipant(ev.name, ev.amount);
                    if (changed) {
                        assert.ok(this.sm.inner instanceof Phase2);
                        const sm = this.sm.inner;
                        this.responseToBroadcast = {
                            ty: "p1Response",
                            bill: Array.from(sm.bill),
                            counts: Array.from(sm.txnCounts)
                        };

                        return this.responseToBroadcast;
                    }
                    break;
                case "p2Confirm":
                    changed = this.sm.p2Confirm(ev.name);
                    if (changed) {
                        assert.ok(this.sm.inner instanceof Phase3);
                        const sm = this.sm.inner;
                        this.responseToBroadcast = {
                            ty: "p2Response",
                            choice: sm.choice,
                            entry: sm.entry
                        }

                        return this.responseToBroadcast;
                    }
                    break;
                case "p2Reject":
                    changed = this.sm.p2Reject();
                    assert.ok(this.sm.inner instanceof Aborted);
                    this.responseToBroadcast = { ty: "rejected" };
                    return this.responseToBroadcast;
                case "p3Confirm":
                    changed = this.sm.p3Confirm(ev.name);
                    assert.ok(changed);
                    assert.ok(this.sm.inner instanceof Accepted);
                    this.responseToBroadcast = { ty: "p3Response" };
                    return this.responseToBroadcast;
                case "p3Reject":
                    changed = this.sm.p3Reject();
                    assert.ok(this.sm.inner instanceof Aborted);
                    this.responseToBroadcast = { ty: "rejected" };
                    return this.responseToBroadcast;
            }
        } catch (error) {
            return { ty: "err", err: "Error processing event of type " + ev.ty + ": " + error };
        }

        return { "ty": "pending" };
    }

    /**
     * Get the response to broadcast to all servers.
     */
    public get toBroadcast(): Response | null {
        return this.responseToBroadcast;
    }

    /**
     * Mark the response to broadcast as sent, clearing it.
     */
    public markAsSent(): void {
        this.responseToBroadcast = null;
    }

}