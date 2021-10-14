import {Request, Response} from "express";

async function mainController (req:Request,res:Response){
    res.json({message:'got request'});
}

export {
    mainController
}