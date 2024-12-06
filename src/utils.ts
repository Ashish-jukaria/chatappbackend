import { v4 as uuidv4 } from 'uuid';
import { RoomsModel } from './db'

export async function generateroomId(){
    const roomid = uuidv4();
    const room=await RoomsModel.findOne({
        roomId:roomid
    })
    if (!room){
        return roomid
    }
    else{
        return generateroomId()
    }

}