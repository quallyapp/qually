# Qually — Step-by-Step Testing Plan

## Phase 0: Infrastructure
- [ ] 0.1 Dev server running on localhost:5174
- [ ] 0.2 TypeScript compiles (0 errors)
- [ ] 0.3 All 10 routes return HTTP 200
- [ ] 0.4 No console errors from app (only browser extensions)

## Phase 1: Wallet Connection
- [ ] 1.1 "Connect Wallet" button visible in header
- [ ] 1.2 Clicking opens Sui wallet selector
- [ ] 1.3 Wallet connects successfully
- [ ] 1.4 Header shows truncated address + Disconnect button
- [ ] 1.5 DashboardLink appears in nav when connected
- [ ] 1.6 Disconnect works — reverts to "Connect Wallet" button

## Phase 2: Bounty Creation
- [ ] 2.1 /create page loads with form
- [ ] 2.2 Bounty type selector works (Fixed/Contest/Grant)
- [ ] 2.3 Form validates required fields
- [ ] 2.4 Walrus upload step shows "Uploading to Walrus..."
- [ ] 2.5 Wallet signature prompt appears
- [ ] 2.6 Transaction succeeds (digest shown)
- [ ] 2.7 Redirects to /post after creation

## Phase 3: Bounty Viewing
- [ ] 3.1 /explore page shows bounties list
- [ ] 3.2 Bounty card shows title (from Walrus), prize, status, deadline
- [ ] 3.3 Clicking bounty card navigates to /bounty/$id
- [ ] 3.4 Bounty detail page shows full brief from Walrus
- [ ] 3.5 Prize pool, time remaining, poster info display correctly
- [ ] 3.6 Poster sees "Poster Actions" panel on their own bounties

## Phase 4: Poster Dashboard
- [ ] 4.1 /post shows "Connect wallet" when disconnected
- [ ] 4.2 /post shows KPI stats when connected
- [ ] 4.3 Created bounty appears in "Active Bounties" list
- [ ] 4.4 "Create New Bounty" FAB links to /create

## Phase 5: User Dashboard
- [ ] 5.1 /dashboard shows "Connect wallet" when disconnected
- [ ] 5.2 /dashboard shows tabs: My Bounties, Submissions, Judging, Notifications
- [ ] 5.3 Created bounties appear in "My Bounties" tab

## Phase 6: Bounty Submission
- [ ] 6.1 /bounty/$id/submit page loads
- [ ] 6.2 File upload area works
- [ ] 6.3 Walrus upload succeeds
- [ ] 6.4 Wallet signature prompt appears
- [ ] 6.5 Transaction succeeds
- [ ] 6.6 Bounty submission_count increments on detail page

## Phase 7: Judge System
- [ ] 7.1 /judges page shows tier system
- [ ] 7.2 "Mint Judge Profile" button works
- [ ] 7.3 Profile ID captured and displayed
- [ ] 7.4 "Apply as Judge" requires bounty ID input
- [ ] 7.5 Apply calls contract with profile ID + bounty ID
- [ ] 7.6 Commit Vote dialog works
- [ ] 7.7 Reveal Vote dialog works

## Phase 8: Poster Actions (on bounty detail page)
- [ ] 8.1 Start Review — changes bounty state to "review"
- [ ] 8.2 Finalize Fixed — picks winner, distributes prize
- [ ] 8.3 Veto Result — within 48h window
- [ ] 8.4 Boost Prize Pool — adds SUI to pool
- [ ] 8.5 Auto Extend — extends deadline

## Phase 9: Disputes & Milestones
- [ ] 9.1 Open Dispute — requires evidence blob + fee
- [ ] 9.2 Submit Evidence — adds evidence to dispute
- [ ] 9.3 Resolve Dispute — arbiter decision
- [ ] 9.4 Create Milestone — for grant bounties
- [ ] 9.5 Submit Milestone — delivery proof
- [ ] 9.6 Approve/Reject Milestone

## Phase 10: Profiles & Leaderboard
- [ ] 10.1 /profile/$address shows profile info
- [ ] 10.2 Create Poster Profile works
- [ ] 10.3 Create Hunter Profile works
- [ ] 10.4 /leaderboard shows ranked list

## Phase 11: Edge Cases
- [ ] 11.1 Expired bounty shows "Expired" deadline
- [ ] 11.2 Non-existent bounty shows "Not Found"
- [ ] 11.3 Wallet not connected — all gated features show connect prompt
- [ ] 11.4 Walrus publisher down — graceful fallback
- [ ] 11.5 Multiple rapid transactions — no state corruption

---

## Current Status
**Phase 0: PASS ✅** — Server running, TypeScript clean, all 10 routes return 200
**Starting Phase 1**
