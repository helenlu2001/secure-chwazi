import { users } from "./database";

const MAX_USER_ID = 1000000;

export const genUserID = () => {
    let user_id = 0;
    while (user_id === 0 || users.includes(user_id)) {
        user_id = Math.floor(Math.random() * MAX_USER_ID);
    }

    users.push(user_id);
    console.log("NEW USER", user_id)

    return user_id;
}
