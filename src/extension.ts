/* eslint-disable curly */
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
import fetch from 'node-fetch';

import { Extract } from 'unzip-stream';
// import { createWriteStream, PathLike } from 'fs';PathLike
import {createReadStream} from 'fs-extra';
import { exec,execFile,execSync  } from 'child_process';
import { homedir } from 'os';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

const isWin = process.platform === "win32"; //|| process.platform === "win64";
const psfont = "(New-Object -ComObject Shell.Application).Namespace(0x14).CopyHere($font.FullName,0x10)";

function ws() : vscode.Uri | undefined{
	if(vscode.workspace.workspaceFolders === null) vscode.window.showInformationMessage("Open A Folder!");
	return vscode.workspace.workspaceFolders?.[0]?.uri;
}

async function macFont(){
	const [w, fs] = [ws(), vscode.workspace.fs]
	if(w === null) return;
	const full     = vscode.Uri.joinPath(w!,"f.zip");
	const out      = vscode.Uri.joinPath(w!,"font").fsPath;
	const fonts    = vscode.Uri.joinPath(w!,"font","ttf");
	const libfonts = vscode.Uri.joinPath(vscode.Uri.file(homedir()),"Library","Font");
	await fetch(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"))
		.then(response=>response.arrayBuffer())
		.then(u=>fs.writeFile(full,new Uint8Array(u)))
		.then(()=>createReadStream(full.fsPath).pipe(Extract({ path: out })));

	await fs.readDirectory(fonts).then(xs=>xs.forEach(([x])=>fs.rename(vscode.Uri.file(x),vscode.Uri.joinPath(libfonts,x))));
		
}

async function winFont(){
	console.log("win 1");
	const [w, fs] = [ws(), vscode.workspace.fs];
	console.log(w,fs);
	if(w === null) return;
	const full     = vscode.Uri.joinPath(w!,"f.zip");
	const out      = vscode.Uri.joinPath(w!,"font").fsPath;
	const fonts    = vscode.Uri.joinPath(w!,"font","ttf");
	console.log(full,out,fonts);
	await fetch(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"))
		.then(response=>response.arrayBuffer())
		.then(u=>fs.writeFile(full,new Uint8Array(u)))
		.then(()=>createReadStream(full.fsPath).pipe(Extract({ path: out })));

	await fs.readDirectory(fonts).then(xs=>xs.forEach(([x])=>exec(psfont,{'shell':'powershell.exe'})));
}

async function minGW(){
	console.log("party");
	const [w, fs] = [ws(), vscode.workspace.fs];
	if(w === null) return;
	const full     = vscode.Uri.joinPath(w!,"g.exe");
	vscode.window.showInformationMessage('Downloading MinGW.');

	await fetch(new URL("https://github.com/msys2/msys2-installer/releases/download/2022-09-04/msys2-x86_64-20220904.exe"))
		.then(response=>response.arrayBuffer())
		.then(u=>fs.writeFile(full,new Uint8Array(u)));

	try{
		vscode.window.showInformationMessage('Installing MinGW.  Leave everything default!');
		execSync(full.fsPath);
		vscode.window.showInformationMessage('Setting Up MinGW');
		execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S mingw-w64-x86_64-gcc\"");
		execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S --needed base-devel mingw-w64-x86_64-toolchain\"");
		vscode.window.showInformationMessage('Done');
	}catch{
		vscode.window.showInformationMessage("Error Installing MinGW");
	}
}


function installMYSYS(){
	if(!isWin) vscode.window.showInformationMessage('Hello from Zach!\nThis command only works on windows');
	else  	   minGW();
}
function installFont(){
	vscode.window.showInformationMessage('Hello from Zach!\nInstalling Font');
	if(isWin) winFont();
	else      macFont();
}





async function newJava(template : string){
	const ww = ws();
	if(ww === null) return;

	const ans = await vscode.window.showInputBox({
		placeHolder: "Class Name",
		prompt: "Enter The Name Of Your Class",
	});
	
	if(ans === undefined || ans === null || ans === '' || ans.length < 1) return vscode.window.showInformationMessage("No Class Name Given!");
	if(ans.includes(' '))               return vscode.window.showInformationMessage("Class Names Cannot Contain Spaces!");

	//concatenation like this is technically bad I believe
	
	const jlo = ans.endsWith(".java") ? ans : "${ans}.java";
	const java = jlo.charAt(0).toUpperCase() + jlo.slice(1);
	const full = vscode.Uri.joinPath(ww!,java);
	try{
		console.log("good heavens",jlo,java,full);
		await vscode.workspace.fs.stat(full);
		vscode.window.showInformationMessage(ans! + " already exists");
		vscode.commands.executeCommand('vscode.open',full);
	}catch{
		vscode.workspace.fs.writeFile(full,new Uint8Array()).then(()=>vscode.commands.executeCommand('vscode.open',full))
		.then(()=>vscode.commands.executeCommand('editor.action.insertSnippet',{"name": template}));
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

	let d4 = vscode.commands.registerCommand("zachtools.newJava", () => newJava("javaTemplate"));
	let d5 = vscode.commands.registerCommand("zachtools.newDoug", () => newJava("dougTemplate"));
	context.subscriptions.push(d5);
	context.subscriptions.push(d4);
	context.subscriptions.push(d2);
	context.subscriptions.push(d);
	
	//	"command": "workbench.action.terminal.newWithProfile"
	
	//vscode.window.registerTerminalProfileProvider('zachtools.MSYS2',  () => ({ name: 'Profile from extension', shellPath: 'bash' }));
		
	
	console.log("changes updated");

}

// this method is called when your extension is deactivated
export function deactivate() {}
