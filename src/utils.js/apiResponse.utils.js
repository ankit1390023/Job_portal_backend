
class apiResponse {
    constructor(statusCode, data, message = 'success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; // Automatically set success based on status code
    }
}

export { apiResponse };
