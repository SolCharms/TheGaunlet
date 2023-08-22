use anchor_lang::prelude::*;

use crate::state::{Tags};

#[repr(C)]
#[account]
#[derive(Debug)]
pub struct Challenge {

    // Crux for which challenge belongs
    pub crux: Pubkey,

    // Seed used to generate unique challenge account PDA address
    pub challenge_seed: Pubkey,

    // ------------- Timestamps
    pub challenge_posted_ts: u64,

    pub challenge_expires_ts: u64,

    // ------------- Reputation
    pub reputation: u64,

    // ------------- Question Info

    pub tags: Vec<Tags>,

    pub title: String, // Max 256 characters

    pub content_data_url: String, // Max 256 characters

    pub content_data_hash: Pubkey,

}
