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

const psfont = (p: string) => `foreach($font in Get-ChildItem -Path "${p}" -File){ (New-Object -ComObject Shell.Application).Namespace(0x14).CopyHere($font.FullName,0x10) }`;

function ws() : vscode.Uri | undefined{
	if(vscode.workspace.workspaceFolders === null || vscode.workspace.workspaceFolders === undefined) vscode.window.showInformationMessage("Open A Folder!");
	return vscode.workspace.workspaceFolders?.[0]?.uri;
}async function macFont(){
	const [w, fs] = [ws(), vscode.workspace.fs];
	if(w === null || w === undefined) return;
	const full     = vscode.Uri.joinPath(w!,"f.zip");
	const out      = vscode.Uri.joinPath(w!,"font");
	const fonts    = vscode.Uri.joinPath(w!,"font","ttf");
	const libfonts = vscode.Uri.joinPath(vscode.Uri.file(homedir()),"Library","Fonts");
	
	await fetch(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"))
	.then(response=>response.arrayBuffer())
	.then(u=>fs.writeFile(full,new Uint8Array(u)))
	.then(()=>fs.createDirectory(out))
	.then(()=>fs.createDirectory(fonts))
	.then(()=>new Promise(r=>createReadStream(`${full.fsPath}`).pipe(Extract({ path: 'font' })).on('close',r)))
	.then(()=>fs.readDirectory(fonts).then(xs=>xs.forEach(([x])=>fs.copy(vscode.Uri.file(x),vscode.Uri.joinPath(libfonts,x)))));
}async function winFont(){
	console.log("win 1");
	const [w, fs] = [ws(), vscode.workspace.fs];
	console.log(w,fs);
	if(w === null || w === undefined) return;
	const full     = vscode.Uri.joinPath(w!,"f.zip");
	const out      = vscode.Uri.joinPath(w!,"font");
	const fonts    = vscode.Uri.joinPath(w!,"font","ttf");
	
	await fetch(new URL("https://github.com/tonsky/FiraCode/releases/download/6.2/Fira_Code_v6.2.zip"))
	.then(response=>response.arrayBuffer())
	.then(u=>fs.writeFile(full,new Uint8Array(u)))
	.then(()=>fs.createDirectory(out))
	.then(()=>new Promise(r=>createReadStream(`${full.fsPath}`).pipe(Extract({ path: `${out.fsPath}` }).on('close',r))))
	.then(()=>execSync(psfont(fonts.fsPath),{'shell':'powershell.exe'}));
}async function minGW(){
	const [ww, fs] = [ws(), vscode.workspace.fs];
	if(ww === null || ww === undefined) return;
	const full     = vscode.Uri.joinPath(ww!,"g.exe");
	console.log(ww,fs,full,full.fsPath);
	vscode.window.showInformationMessage('Downloading MinGW.');

	await fetch(new URL("https://github.com/msys2/msys2-installer/releases/download/2022-09-04/msys2-x86_64-20220904.exe"))
		.then(response=>response.arrayBuffer())
		.then(u=>fs.writeFile(full,new Uint8Array(u)));

	console.log("Fetch Finished");
	try{
		vscode.window.showInformationMessage('Installing MinGW.  Leave everything default!');
		execSync(`"${full.fsPath}"`);
	}catch{}

	try{
		vscode.window.showInformationMessage('Setting Up MinGW');
		execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S mingw-w64-x86_64-gcc\"");
	}catch{}

	try{
		execSync("C:\\msys64\\usr\\bin\\mintty.exe /bin/env MSYSTEM=MINGW64 /bin/bash -l -c \"pacman -S --needed base-devel mingw-w64-x86_64-toolchain\"");
	}catch{}
	vscode.window.showInformationMessage('Done');
}function installMYSYS(){
	if(!isWin) vscode.window.showInformationMessage('Hello from Zach!\nThis command only works on windows');
	else       minGW();
}function installFont(){
	vscode.window.showInformationMessage('Hello from Zach!\nInstalling Font');
	if(isWin) winFont();
	else      macFont();
	vscode.window.showInformationMessage('Finished Installing Font');
}async function newJava(template : string){
	const ww = ws();
	if(ww === null || ww === undefined) return;

	const ans = await vscode.window.showInputBox({
		placeHolder: "Class Name",
		prompt: "Enter The Name Of Your Class",
	});
	
	if(ans === undefined || ans === null || ans === '' || ans.length < 1) return vscode.window.showInformationMessage("No Class Name Given!");
	if(ans.includes(' '))               return vscode.window.showInformationMessage("Class Names Cannot Contain Spaces!");

	//concatenation like this is technically bad I believe
	
	const jlo = ans.endsWith(".java") ? ans : `${ans}.java`;
	const java = jlo.charAt(0).toUpperCase() + jlo.slice(1);
	const full = vscode.Uri.joinPath(ww!,java);
	try{
		await vscode.workspace.fs.stat(full);
		vscode.window.showInformationMessage(ans! + " already exists");
		vscode.commands.executeCommand('vscode.open',full);
	}catch{
		vscode.workspace.fs.writeFile(full,new Uint8Array()).then(()=>vscode.commands.executeCommand('vscode.open',full))
		.then(()=>vscode.commands.executeCommand('editor.action.insertSnippet',{"name": template}));
	}
}function quickFixHover(){
	vscode.commands.executeCommand("editor.action.showHover");
	vscode.commands.executeCommand("editor.action.quickFix");
}


export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "zachtools" is now active!');

	// The command has been defined in the package.json file
	const coms = [];
	
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	coms.push(vscode.commands.registerCommand("zachtools.installFont",  () => installFont()));
	coms.push(vscode.commands.registerCommand("zachtools.installMinGW", () => installMYSYS()));
	coms.push(vscode.commands.registerCommand("zachtools.newJava",      () => newJava("javaTemplate")));
	coms.push(vscode.commands.registerCommand("zachtools.newDoug",      () => newJava("dougTemplate")));
	coms.push(vscode.commands.registerCommand("zachtools.showHoverFix", () => quickFixHover()));

	coms.forEach(x=>context.subscriptions.push(x));
	
	console.log("changes updated");

}

// this method is called when your extension is deactivated
export function deactivate() {}
