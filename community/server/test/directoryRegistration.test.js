"use strict";
const test=require("node:test"); const assert=require("node:assert/strict"); const {validateRegistration}=require("../lib/validate");
function validBody(directoryParticipation){return{first_name:"Dean",last_name:"Testworthy",email:"dean@example.com",directory_participation:directoryParticipation,directory_participation_version:"2026-09-07",privacy_consent:"agreed",privacy_notice_version:"2026-07-30"};}
test("Directory participation is required",()=>{const r=validateRegistration(validBody("")); assert.equal(r.valid,false); assert.ok(r.errors.some(e=>e.field==="directory-participation"));});
test("Directory Yes is accepted",()=>{const r=validateRegistration(validBody("yes")); assert.equal(r.valid,true); assert.equal(r.value.directoryParticipation,"yes");});
test("Directory No is accepted",()=>{const r=validateRegistration(validBody("no")); assert.equal(r.valid,true); assert.equal(r.value.directoryParticipation,"no");});
test("unexpected Directory values are rejected",()=>{const r=validateRegistration(validBody("maybe")); assert.equal(r.valid,false);});
