import { query, collection, getDocs, getDoc, where, doc, setDoc } from "firebase/firestore";
import { db } from './Firebase.js';

export const handleSignIn = async (user, pwd, res) => {
    if (user !== "" && pwd !== "" && user !== undefined && pwd !== undefined) {
        try {
            const q = query(
                collection(db, "credentials"),  // Reference to the 'credentials' collection
                where("username", "==", user),   // Filter by username
                where("password", "==", pwd)     // Filter by password
            );

            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                res.status(403).json("Please enter a valid Username & Password");
            } else {
                const isOnboarded = await validateOnboarding(user);
                if (isOnboarded) {
                    const id = await getDoc(doc(db, "onboardForm", user));
                    const account = id.data();
                    res.status(200).json({
                        given_name: account.identity.given_name,
                        family_name: account.identity.family_name,
                        email_address: account.contact.email_address,
                        account_id: account.id
                    });
                } else {
                    res.status(206).json("Proceed to Onboarding");
                }
            }
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    } else {
        return res.json(403).json("Invalid input");
    }
};

async function validateOnboarding(email) {
    const docRef = doc(db, "onboardForm", email);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

async function redirectToOnboarding(res, db, email) {
    const id = await getDoc(doc(db, "onboardForm", email));
    const user = id.data();
    res.send(user.identity.given_name, user.identity.family_name, user.contact.email_address, user.id);
}

export const submitForm = (form, res) => {
    let status = 0;
    fetch('https://broker-api.sandbox.alpaca.markets/v1/accounts', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa('CK1EORZKTUUZAJ66071D:28Q354poQSbZ6i6FWrGSZJIjObkJfyZavYhOZ1H1')}`,
        },
        body: JSON.stringify(form),
    })
        .then(response => {
            status = response.status;
            return response.json()
        })
        .then(response => {
            if (status === 200) {
                console.log("status is 200")
                setDoc(doc(collection(db, "onboardForm"), form.contact.email_address), response)
                    .then(res.status(200).json({ "username": response.id, "message": "Successfully onboarded to Alpaca" }))
            } else if (status === 400) {
                res.status(400).json("Please fill all the mandatory fields");
            } else if (status === 409) {
                res.status(409).json("There is already an existing account registered with the same email address");
            } else if (status === 400) {
                res.status(400).json("One of the input values is not a valid value");
            } else {
                console.log("response", response)
                console.log("status", status)
                res.status(500).json("Something went wrong, please try again");
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json("Something went wrong, please try again")
        });
}

export const handleSignUp = async (user, pwd, res) => {
    const q = query(collection(db, "credentials"), where("username", "==", user));
    await getDocs(q)
        .then((querySnapshot) => {
            if (querySnapshot.empty === true) {
                setDoc(doc(collection(db, "credentials"), user), {
                    username: user,
                    password: pwd,
                    isOnboarded: false
                })
                    .then(
                        res.status(200).json("begin Onboarding")
                    ).catch(
                        err => {
                            res.send(500).json("something went wrong");
                        }
                    )
            } else {
                res.status(403).send("Please use another username")
            }
        })
}

const beginOnboarding = (user) => { }