
const Users = require("../models/user");
const Roles = require("../models/roles");

async function main() {
    await roles();
    await createAdmin();
    process.exit();
}

const roles = async() => {
    try {
        const roles = await Roles.findOne({
            where: {name: "Admin"}
        });
        if (!roles) {
            await Roles.bulkCreate(
                [
                    { name: 'Admin', createdAt: new Date(), updatedAt: new Date()},
                    { name: 'Operator', createdAt: new Date(), updatedAt: new Date() },
                    { name: 'Driver', createdAt: new Date(), updatedAt: new Date() },
                    { name: 'Client', createdAt: new Date(), updatedAt: new Date() },
                    { name: 'Partner', createdAt: new Date(), updatedAt: new Date() }
                ]
            );
        }
    }catch (e) {
        return e;
    }
}

const createAdmin = async() => {
    try {
        const user = await Users.findOne({
            where: {phoneNumber: "+37477272850"}
        });
        if (!user) {
            const user = await Users.create({
                phoneNumber: "+37477272850",
                username: "admin",
                firstName: "Admin",
                lastName: "Admin",
                email: "admin@habaexpress.com",
                role: 1,
                verified: true,
                password: '123456789Aa@#',
            }).then(function (users) {
                if (users) {
                    console.log("USER")
                } else {
                    console.log("USER")
                }
            });
        }
        return true;
    }catch (e) {
        return e;
    }
}

main().then(r => console.log(r-- > 'Done')).catch(e => console.log(e));

