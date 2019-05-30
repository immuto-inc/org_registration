var im = Immuto.init(true, "https://dev.immuto.io") // https://dev.immuto.io for dev env

function login () {
    if (im.authToken) {
        im.deauthenticate()
    }

    $("#login-button").attr("disabled", true)


    let email = $("#email-input").val()
    let password = $("#password-input").val()

    if (!email) {
        alert("Error: Email required.")
        $("#login-button").attr("disabled", false)

        return
    }

    if (!password) {
        alert("Error: Password required.")
        $("#login-button").attr("disabled", false)

        return
    }

    im.authenticate(email, password).then((authToken) => {
        window.location.href = "/dashboard?authToken=" + authToken
    }).catch((err) => {
        $("#login-button").attr("disabled", false)

        alert("Unable to login: \n" + err)
    })
}