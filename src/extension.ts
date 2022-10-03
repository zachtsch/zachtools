/* eslint-disable curly */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import fetch from 'node-fetch';

import { Extract } from 'unzip-stream';
// import { createWriteStream, PathLike } from 'fs';PathLike
import {createReadStream,createWriteStream,PathLike,copySync,readdir} from 'fs-extra';
import { exec  } from 'child_process';
import { resolve } from 'path';
import { homedir } from 'os';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const isWin = process.platform === "win32"; //|| process.platform === "win64";
const psfont = "foreach($font in Get-ChildItem -Path \"$pwd\\font\\ttf\" -File){ (New-Object -ComObject Shell.Application).Namespace(0x14).CopyHere($font.FullName,0x10) } "
const downloadFile = (async (url: URL, path: PathLike) : Promise<unknown> => {
	const res = await fetch(url);
	const fileStream = createWriteStream(path);
	return await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", reject);
		fileStream.on("finish", resolve);
	});
});


function win(res : Function,rej : Function){
	exec(psfont,{'shell':'powershell.exe'}, (error, stdout, stderr)=> error ? rej() : res("ha"));
}

function wingc(res : Function, rej : Function){
	exec("./g.exe",{'shell':'powershell.exe'}, (error, stdout, stderr)=> error ? rej() : res("ha"));
}

function mac(res : Function, rej : Function){
	readdir(resolve(__dirname,"font","ttf"), (err, files) => {
		if (err) rej();
	  
		files.forEach(file => {
			copySync(resolve(__dirname, "font", "ttf",file), resolve(homedir(),"Library","Fonts",file));
		});
	});
	res();
}


function font(){
	downloadFile(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"),resolve(__dirname,"f.zip"))
		.then(()=>createReadStream(resolve(__dirname,"f.zip")).pipe(Extract({ path: resolve(__dirname,"font") })))
		.then(()=>isWin ? new Promise(win) : new Promise(mac))
		.then(()=>vscode.window.showInformationMessage("Successful Install"))
		.catch(x=>vscode.window.showInformationMessage("Something Went Wrong!!!"));
}

function minGW(){
 	if(!isWin) return;
 	downloadFile(new URL("https://github.com/msys2/msys2-installer/releases/download/2022-09-04/msys2-x86_64-20220904.exe"),resolve(__dirname,"g.exe"))
		.then(()=>new Promise(wingc))
		.then(()=>vscode.window.showInformationMessage("Successful Install"))
		.catch(x=>vscode.window.showInformationMessage("Follow MSYS2 Instructions.  Leave everything default!!!"));
 }
function installFont(){
	vscode.window.showInformationMessage('Hello from Zach!\nInstalling Font');
	font();
}

function installMinGW(){
	vscode.window.showInformationMessage('Hello from Zach!\nInstalling MinGw');
	minGW();
}

export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zachtools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let d = vscode.commands.registerCommand("zachtools.installFont", () => installFont());
	let d2 = vscode.commands.registerCommand("zachtools.installMinGW", () => installMinGW());
	context.subscriptions.push(d2);
	context.subscriptions.push(d);
	
			
	console.log("yoyo");

}

// this method is called when your extension is deactivated
export function deactivate() {}
