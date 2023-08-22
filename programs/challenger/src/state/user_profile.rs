use anchor_lang::prelude::*;

#[proc_macros::assert_size(144)] // +5 to make it divisible by 8
#[repr(C)]
#[account]
#[derive(Debug)]
pub struct UserProfile {

    // ------------- profile account info

    pub profile_owner: Pubkey,

    pub crux: Pubkey,

    // ------------- Timestamps

    pub profile_created_ts: u64,

    pub most_recent_engagement_ts: u64,

    // ------------- user engagement counters

    pub challenges_submitted: u64,

    pub challenges_completed: u64,

    pub reputation_score: u64,

    // ------------- miscellaneous

    pub nft_pfp_token_mint: Pubkey,

    // ------------- authorizations

    pub is_moderator: bool,

}
