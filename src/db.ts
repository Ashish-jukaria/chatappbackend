import mongoose, { Schema } from "mongoose";


const User =new Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true}
})

export const UserModel=mongoose.model('User',User)

const Rooms=new Schema({
    roomName:{type:String,required:true},
    roomId:{type:String,unique:true},
    owner:String,
    users:[],
    chats:[
        {
            
            user:String,
            message:String
    }
    ]
})
export const RoomsModel=mongoose.model('Rooms',Rooms)
