import {RawEntry, TransactionLog} from "./log";
import * as assert from "assert";
import {KeyPair} from "./vrf";
import {proposeTransaction} from "./chwazi";

class Phase1 {
    private readonly participants: Map<string, number> = new Map<string, number>();
    constructor(private readonly keys: KeyPair, private readonly log: TransactionLog) {}

    addParticipant(name: string, amount: number): Phase1 {
        this.participants.set(name, amount);
        return this;
    }

    finalize(): Phase2 {
        return new Phase2(this.participants, this.keys, this.log);
    }
}

class Phase2 {
    private readonly confirmed: Set<string> = new Set<string>();
    constructor(private readonly participants: Map<string, number>, private readonly keys: KeyPair, private readonly log: TransactionLog) {}

    confirm(name: string): Phase3 | Phase2 {
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
}

class Phase3 {
    private readonly proposedEntry: RawEntry;
    private readonly confirmed: Set<string> = new Set<string>();
    constructor(participants: Map<string, number>, private readonly keys: KeyPair, private readonly log: TransactionLog) {
        this.proposedEntry = proposeTransaction({ participants }, keys.secretKey, log);
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
}

class Accepted {
    constructor(rawEntry: RawEntry, log: TransactionLog) { log.add(rawEntry); }
}

class Aborted {}

export class StateMachine {
    private state: Phase1 | Phase2 | Phase3 | Accepted | Aborted;
    constructor(keys: KeyPair, log: TransactionLog) {
        this.state = new Phase1(keys, log);
    }

    addParticipant(name: string, amount: number): void {
        if (!(this.state instanceof Phase1)) {
            throw new Error("Wrong phase for addParticipant!");
        }

        this.state = this.state.addParticipant(name, amount);
    }

    finalize(): void {
        if (!(this.state instanceof Phase1)) {
            throw new Error("Wrong phase for finalize!");
        }

        this.state = this.state.finalize();
    }

    p2Confirm(name: string): void {
        if (!(this.state instanceof Phase2)) {
            throw new Error("Wrong phase for p2Confirm!");
        }

        this.state = this.state.confirm(name);
    }

    p2Reject(): void {
        if (!(this.state instanceof Phase2)) {
            throw new Error("Wrong phase for p2Reject!");
        }

        this.state = this.state.reject();
    }

    p3Confirm(name: string): void {
        if (!(this.state instanceof Phase3)) {
            throw new Error("Wrong phase for p3Confirm!");
        }

        this.state = this.state.confirm(name);
    }

    p3Reject(): void {
        if (!(this.state instanceof Phase3)) {
            throw new Error("Wrong phase for p3Reject!");
        }

        this.state = this.state.reject();
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
}

