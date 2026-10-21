class ApiError extends Error{
    constructor(
        statusCode,
        message ="Something Went Wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        // Parent Error class ko message pass kar raha hai.
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success =false
        this.error = errors

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
            
        }
    }
}

export {ApiError};