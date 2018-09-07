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


    findBotPositions(idArray) {
        let self = this;
        let boardInfo = this.request.boardInfo;
        let temp = {};
        idArray.forEach(function(id){
            temp[id] = [];
            let size = boardInfo.length;
            for(let i = 0; i < size; i++){
                for(let j = 0; j < size; j++){
                    if(id === boardInfo[i][j]){
                        temp[id].push([i,j]);
                    }
                }
            }
        })
        
        return temp;
    }

    // Removes all positions that are out of boundary
    filterOutOfBoundaryMoves (positions) {
        let size = this.request.boardInfo.length;
        return positions.filter(function (pos) {
            return ((pos[0] >= 0 && pos[0] < size) && (pos[1] >= 0 && pos[1] < size))
        })
    }

    // Removes all position with the specific id
    filterById (positions, id) {
        let boardInfo = this.request.boardInfo;
        return positions.filter(function (pos) {
            let i = pos[0],
            j = pos[1];
            return id.indexOf(boardInfo[i][j]) === -1;
        });
    }

    //Returns all position relative to cellPos and step from cellPos
    findAllPositions (cellPos, step) {
        return [
            [cellPos[0] - step, cellPos[1] - step],
            [cellPos[0] - step, cellPos[1]],
            [cellPos[0] - step, cellPos[1] + step],
            [cellPos[0], cellPos[1] - step],
            [cellPos[0], cellPos[1] + step],
            [cellPos[0] + step, cellPos[1] - step],
            [cellPos[0] + step, cellPos[1]],
            [cellPos[0] + step, cellPos[1] + step]
        ]
    }

    //Returns only the possible positions from the cellPos
    findOnlyPossibePositions (cellPos, step) {
        // getAll possible moves 
        let allPos = this.findAllPositions(cellPos, step);

        let filter1 = this.filterOutOfBoundaryMoves(allPos);
        
        // filter by both opp bot id and block id
        let filter2 = this.filterById(filter1, [2, -1]);
        return filter2;
    }

    findPossibleMoves (cellPos, step) {
        return this.findOnlyPossibePositions(cellPos, step);
    }





    
    // takes request as param
    // return complete respons object 
    whatsMyMove(){
        // assign variable to freq used params, myID, oppID 
        let myID = this.request.yourID;
        let oppID = 3 % myID;
        // return object  of Bot Position for the corresponding ID 
        // obj = {myID : [], oppID : []}
        this.findBotPositions([1,2]);

        // // cellPosition can be my cell or opponent Cell
        // // step = 1 for clone, step =2 for jump
        let moves = this.findPossibleMoves([6,0], 1) 

        // // add Decision making logic here 
        this.wife();
    }
    
    move(request) {
        console.log("Request move:", request.boardInfo);
        this.request = request;
        //
        // ** Move logic here. **
        //

        this.whatsMyMove();
        
        let response = {
            dataType: "response",
            fromCell: [2, 2],
            toCell: [2, 4],
        };

        console.log("Respond move:", response);
        this.splClient.respond(response);
    }
    
    
}

module.exports = Bot;
