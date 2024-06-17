import React, { useEffect, useState } from "react";

export default function Authentication(){
    const [newUser, setNewUser] = useState(false);

    const [title, setTitle] = useState('');
    const [reverse, setReverse] = useState('');
    const [action, setAction] = useState('');

    useEffect(() => {
        setTitle(newUser ? "Register" : "Login");
        setAction(newUser ? "/register" : "/login");
        setReverse(newUser ? "already an account" : "new user");

    }, [newUser]);

    return (
        <div>
            <h1>{title}</h1>
            <form action={action} method="POST">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" required/>
                <br />
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" name="password" required/>
                <br />
                <button type="submit" id="submitButton">{title}</button>
            </form>
            <button onClick={() => setNewUser(!newUser)}>{reverse}</button>
        </div>
    )
};