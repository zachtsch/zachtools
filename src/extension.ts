/* eslint-disable curly */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import fetch from 'node-fetch';

import { Extract } from 'unzip-stream';
// import { createWriteStream, PathLike } from 'fs';PathLike
import {createReadStream,createWriteStream,PathLike,copySync,readdir, writeFile,existsSync} from 'fs-extra';
import { exec,execFile,execSync  } from 'child_process';
import { resolve,parse } from 'path';
import { homedir } from 'os';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const isWin = process.platform === "win32"; //|| process.platform === "win64";
const psfont = "foreach($font in Get-ChildItem -Path \"$pwd\\font\\ttf\" -File){ (New-Object -ComObject Shell.Application).Namespace(0x14).CopyHere($font.FullName,0x10) } ";
const downloadFile = (async (url: URL, path: PathLike) : Promise<unknown> => {
	const res = await fetch(url);
	const fileStream = createWriteStream(path);
	return await new Promise((resolve, reject) => {
		res.body.pipe(fileStream);
		res.body.on("error", reject);
		fileStream.on("finish", resolve);
	});
});


function macFont(){
	downloadFile(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"),resolve(__dirname,"f.zip"))
		.then(()=>createReadStream(resolve(__dirname,"f.zip")).pipe(Extract({ path: resolve(__dirname,"font") })))
		.then(()=>new Promise((res,rej)=>{
			readdir(resolve(__dirname,"font","ttf"), (err, files) => {
				if (err) rej();
			  
				files.forEach(file => {
					copySync(resolve(__dirname, "font", "ttf",file), resolve(homedir(),"Library","Fonts",file));
				});
				res("SUCESS");
			});
		}))
		.catch(x=>{
			vscode.window.showInformationMessage("Something Went Wrong!!!");
			console.log("ERRR",x);
		});
}

function winFont(){

	downloadFile(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"),resolve(__dirname,"f.zip"))
		.then(()=>createReadStream(resolve(__dirname,"f.zip")).pipe(Extract({ path: resolve(__dirname,"font") })))
		.then(()=>new Promise((res,rej)=>exec(psfont,{'shell':'powershell.exe'}, (error, stdout, stderr)=> error ? rej() : res("ha"))))
		.then(()=>vscode.window.showInformationMessage("Successful Install"))
		.catch(x=>{
			vscode.window.showInformationMessage("Something Went Wrong!!!");
			console.log("ERRR",x);
		});
}

function minGW(){
	// vscode.window.showInformationMessage('Downloading and install MinGw. Leave everything default!!!');
 	downloadFile(new URL("https://github.com/msys2/msys2-installer/releases/download/2022-09-04/msys2-x86_64-20220904.exe"),resolve(__dirname,"g.exe"))
		.then(()=>new Promise((res,rej)=>execFile(resolve(__dirname,"g.exe"), (error, stdout, stderr)=> error ? rej() : res("ha"))))
		.then(()=>execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S mingw-w64-x86_64-gcc\""))
		.then(()=>execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S --needed base-devel mingw-w64-x86_64-toolchain\""))
		.catch(x=>vscode.window.showInformationMessage("Something went wrong maybe"));
}

function installMYSYS(){
	if(!isWin) vscode.window.showInformationMessage('Hello from Zach!\nThis command only works on windows');
	else       minGW();
	minGW();
}
function installFont(){
	vscode.window.showInformationMessage('Hello from Zach!\nInstalling Font');
	if(isWin) winFont();
	else      macFont();
}

async function newJava(template : string){
	const ans = await vscode.window.showInputBox({
		placeHolder: "Class Name",
		prompt: "Enter The Name Of Your Class",
	});
	
	if(ans === undefined || ans === '') return;
	const jlo = ans!.endsWith(".java") ? parse(ans!).name : ans!;
	const java = jlo.charAt(0).toUpperCase() + jlo.slice(1);
	const f = resolve(__dirname,java + ".java");

	if(existsSync(f)){
		vscode.window.showInformationMessage(ans! + " already exists");
		vscode.commands.executeCommand('vscode.open',vscode.Uri.file(f));
	}else{
		writeFile(f,"")
		.then(()=>vscode.commands.executeCommand('vscode.open',vscode.Uri.file(f)))
		.then(()=>vscode.commands.executeCommand('editor.action.insertSnippet',{"name": template}))
		.catch(x=>console.log("Error writing file", x));
		

	}
}

export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zachtools" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let d = vscode.commands.registerCommand("zachtools.installFont", () => installFont());
	let d2 = vscode.commands.registerCommand("zachtools.installMinGW", () => installMYSYS());
	let d3 = vscode.commands.registerCommand("zachtools.newJava", () => newJava("javaTemplate"));
	let d4 = vscode.commands.registerCommand("zachtools.newDoug", () => newJava("dougTemplate"));
	context.subscriptions.push(d4);
	context.subscriptions.push(d3);
	context.subscriptions.push(d2);
	context.subscriptions.push(d);
	
	//	"command": "workbench.action.terminal.newWithProfile"
	
	//vscode.window.registerTerminalProfileProvider('zachtools.MSYS2',  () => ({ name: 'Profile from extension', shellPath: 'bash' }));
		
	
	console.log("changes updated");

}

// this method is called when your extension is deactivated
export function deactivate() {}
