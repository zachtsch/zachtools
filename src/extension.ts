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
import { spawn } from 'child_process';
import { resolve } from 'path';
import { homedir } from 'os';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const isWin = process.platform === "win32"; //|| process.platform === "win64";
const downloadFile = (async (url: URL, path: PathLike) => {
	const res = await fetch(url);
	const fileStream = createWriteStream(path);
	await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", reject);
		fileStream.on("finish", resolve);
	});
});

// function unzipp(f: PathLike) {
//     ;
// }

function win(){
	spawn("powershell.exe",["dir ./*.ttf | %{ (New-Object -ComObject Shell.Application).Namespace(0x14).CopyHere($_.fullname) }"]);
}

function mac(){
	readdir(resolve(__dirname,"font","ttf"), (err, files) => {
		if (err) throw err;
	  
		files.forEach(file => {
			copySync(resolve(__dirname, "font", "ttf",file), resolve(homedir(),"Library","Fonts",file));
		});
	  });
	

}
function font(){
	downloadFile(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"),resolve(__dirname,"f.zip"))
		.then(()=>createReadStream(resolve(__dirname,"f.zip")).pipe(Extract({ path: resolve(__dirname,"font") })))
		.then(()=>isWin ? win() : mac())
		.then(()=>vscode.window.showInformationMessage("Successful Install"))
		.catch(x=>vscode.window.showInformationMessage("Something Went Wrong!!!"));
}


  
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zachtools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('zachtools.helloWorld', () => {
		vscode.window.showInformationMessage('Hello from Zach!');
		font();
	});


	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
