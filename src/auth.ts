import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config()

export const SECRET_KEY:any=process.env.SECRET_KEY
export interface CustomRequest extends Request{
  username?:string|JwtPayload
}

export function Auth(req:CustomRequest,res:Response,next:NextFunction){
    try{

    
    if (req.headers.token){
    const token=req.headers.token as string
    const decoded_token=jwt.verify(token,SECRET_KEY)
    if (token){
        req.username=decoded_token
        next()
    }
    else{
        res.status(400).send('Unauthorized')

    }
    }}
    catch(e){
        res.status(400).send('Error in Auth')
    }
}