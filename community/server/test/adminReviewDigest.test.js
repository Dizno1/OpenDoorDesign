"use strict";
const test=require('node:test');
const assert=require('node:assert/strict');
const {reviewToken,validToken,detailPage}=require('../admin/memberReview');
const {previousEasternDay}=require('../admin/dailyDigest');
test('review token rejects altered and missing values',()=>{
 const token=reviewToken('private-secret','member1');
 assert.equal(validToken('private-secret','member1',token),true);
 assert.equal(validToken('private-secret','member2',token),false);
 assert.equal(validToken('private-secret','member1','bad'),false);
});
test('review page escapes member-provided text',()=>{
 const html=detailPage({id:'m1',first_name:'<script>',last_name:'Smith',email:'x@example.org',status:'active',created_at:'2026-10-27',reviewed_at:null,interests:['<img>'],participation:[],directory_choice:'no',about_you:'<iframe>'},'secret');
 assert.doesNotMatch(html,/<script>|<iframe>|<img>/);
 assert.match(html,/Mark as reviewed/);
});
test('digest date follows Eastern calendar date',()=>{
 assert.equal(previousEasternDay(new Date('2026-10-27T12:00:00Z')),'2026-10-26');
 assert.equal(previousEasternDay(new Date('2026-01-02T12:00:00Z')),'2026-01-01');
});
