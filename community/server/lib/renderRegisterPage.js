"use strict";
const fs=require("fs"); const path=require("path");
const REGISTER_PAGE_PATH=path.join(__dirname,"..","templates","register.html");
function escapeHtml(value){return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
const FIELD_ORDER=["first-name","last-name","email","directory-participation","privacy-agreement"];
const FIELD_ERROR_IDS={"first-name":"first-name-error","last-name":"last-name-error","email":"email-error","directory-participation":"directory-participation-error","privacy-agreement":"privacy-error"};
function renderRegisterPageWithErrors(errors,submitted){
 let html=fs.readFileSync(REGISTER_PAGE_PATH,"utf8");
 html=html.replace("<title>Join the Community - Open Door Design</title>","<title>There is a problem - Join the Community - Open Door Design</title>");
 const byField=new Map(errors.map(error=>[error.field,error.message])); const firstInvalidField=FIELD_ORDER.find(fieldId=>byField.has(fieldId));
 FIELD_ORDER.forEach(fieldId=>{const errorId=FIELD_ERROR_IDS[fieldId],message=byField.get(fieldId); if(!message)return; html=html.replace(new RegExp(`<p id="${errorId}" class="field-error" hidden></p>`),`<p id="${errorId}" class="field-error">${escapeHtml(message)}</p>`);});
 ["first-name","last-name","email","privacy-agreement"].forEach(fieldId=>{if(!byField.has(fieldId))return; const isFirst=fieldId===firstInvalidField; html=html.replace(new RegExp(`(<input id="${fieldId}"[^>]*)>`),(match,openTag)=>`${openTag} aria-invalid="true"${isFirst?" autofocus":""}>`);});
 if(byField.has("directory-participation")){const isFirst=firstInvalidField==="directory-participation"; html=html.replace(/(<input id="directory-participation-yes"[^>]*)>/,(m,o)=>`${o} aria-invalid="true"${isFirst?" autofocus":""}>`); html=html.replace(/(<input id="directory-participation-no"[^>]*)>/,(m,o)=>`${o} aria-invalid="true">`);}
 html=html.replace(/<input id="first-name" name="first_name" type="text" autocomplete="given-name" maxlength="100" required aria-describedby="first-name-error"([^>]*)>/,match=>match.replace('aria-describedby="first-name-error"',`value="${escapeHtml(submitted.firstName||"")}" aria-describedby="first-name-error"`));
 html=html.replace(/<input id="last-name" name="last_name" type="text" autocomplete="family-name" maxlength="100" required aria-describedby="last-name-error"([^>]*)>/,match=>match.replace('aria-describedby="last-name-error"',`value="${escapeHtml(submitted.lastName||"")}" aria-describedby="last-name-error"`));
 html=html.replace(/<input id="email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="email-hint email-error"([^>]*)>/,match=>match.replace('aria-describedby="email-hint email-error"',`value="${escapeHtml(submitted.email||"")}" aria-describedby="email-hint email-error"`));
 html=html.replace(/<textarea id="about-you" name="about_you" rows="6" maxlength="2000" aria-describedby="about-you-hint"><\/textarea>/,`<textarea id="about-you" name="about_you" rows="6" maxlength="2000" aria-describedby="about-you-hint">${escapeHtml(submitted.aboutYou||"")}</textarea>`);
 const escapeForRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 (submitted.interests||[]).forEach(value=>{html=html.replace(new RegExp(`(<input type="checkbox" name="interests" value="${escapeForRegex(value)}")`),"$1 checked");});
 (submitted.accessibilityPerspectives||[]).forEach(value=>{html=html.replace(new RegExp(`(<input type="checkbox" name="accessibility_perspectives" value="${escapeForRegex(value)}")`),"$1 checked");});
 (submitted.participationPreferences||[]).forEach(value=>{html=html.replace(new RegExp(`(<input type="checkbox" name="participation_preferences" value="${escapeForRegex(value)}")`),"$1 checked");});
 if(submitted.directoryParticipation==="yes")html=html.replace('id="directory-participation-yes" name="directory_participation" type="radio" value="yes"','id="directory-participation-yes" name="directory_participation" type="radio" value="yes" checked');
 if(submitted.directoryParticipation==="no")html=html.replace('id="directory-participation-no" name="directory_participation" type="radio" value="no"','id="directory-participation-no" name="directory_participation" type="radio" value="no" checked');
 return html;
}
module.exports={renderRegisterPageWithErrors};
