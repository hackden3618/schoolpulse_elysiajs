export function usersController(store: any) {
    return({
        message: "This is from the user controller",
        body: {
            user: "Dennis",
            password: "password",
            store: store
        }
    })
}
