/*
 * bot.js
 *
 * Main logic of the bot resides in this file.
 *
 * This Bot class recieves an incoming request, look at the
 * data, figures out the response and then send it back.
 *
 */

const SplClient = require('./splClient.js');

class Bot {
    constructor(host, port) {
        this.splClient = new SplClient(host, port, this.request.bind(this));
    }

    start() {
        this.splClient.listen();
    }

    /*
     * Entry point for each incoming request from SBOX
     *
     */
    request(data) {
        try {
            switch(data.dataType.trim()) {
                case "authentication" :
                    this.authentication(data);
                    break;
                case "command" :
                    this.move(data);
                    break;
                case "acknowledge" :
                    this.acknowledgement(data);
                    break;
                case "result" :
                    this.result(data);
                    break;
            }
        } catch (err) {
            console.error("Error processing request");
            console.error(err);
        }
    }

    authentication(data) {
        // Send back the one-time-password that
        // was received in the request.
        let response = {
            dataType: 'oneTimePassword',
            oneTimePassword: data.oneTimePassword,
        };
        this.splClient.respond(response);
    }

    acknowledgement(data) {
        console.log("Ack :: status :", data.message);
    }

    result(data) {
        console.log("Game over ::", data.result);
    }

    move(request) {
        console.log("Request move:", request.boardInfo);

        //
        // ** Move logic here. **
        //

        
        
        let response = {
            dataType: "response",
            fromCell: [2, 2],
            toCell: [2, 4],
        };

        console.log("Respond move:", response);
        this.splClient.respond(response);
    }

    // takes request as param
    // return complete respons object 
    whatsMyMove(request){
        // assign variable to freq used params, myID, oppID 

        // return object  of Bot Position for the corresponding ID 
        // obj = {myID : [], oppID : []}
        this.findBotPositions(idArray);

        // cellPosition can be my cell or opponent Cell
        // step = 1 for clone, step =2 for jump
        this.findPossibleMoves(cellPos, step) 

        // add Decision making logic here 
        this.wife();
    }
}

module.exports = Bot;
