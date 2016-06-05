export default {


	/**
	 * Send request to server api
	 * @param url
	 * @param data
	 * @param method
	 * @returns {Promise}
	 */
	sendRequest(url, data, {method = "POST"} = {}) {
		return new Promise((resolve, reject) => {
			$.ajax({
				method,
				url,
				data: data ? JSON.stringify(data) : "",
				beforeSend: (xhr) => {
					xhr.setRequestHeader('Content-Type', 'application/json');
				},
				statusCode: {
					400: () => { return reject("Access denied") },
					404: () => { return reject("Page not found") }
				}
			})
				.done(( {error = "", n, arrays = [], points = []} ) => {
	
					if (error) {
						return reject(error);
					}
	
					resolve({n, data: arrays, points});
	
				})
				.fail(() => {
					return reject("Cannot create the channel");
				});
		})
	},
	

	/**
	 * Show the message
	 * @param msg
	 */
	showMsg(msg) {
		alert(msg);
	}
}