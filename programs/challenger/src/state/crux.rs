use anchor_lang::prelude::*;

pub const LATEST_CRUX_VERSION: u16 = 0;
pub use crate::state::{CruxCounts, CruxFees};

#[proc_macros::assert_size(176)] // +5 to make it divisible by 8
#[repr(C)]
#[account]
#[derive(Debug)]
pub struct Crux {
    pub version: u16,

    pub crux_manager: Pubkey,

    pub crux_authority: Pubkey,

    pub crux_authority_seed: Pubkey,

    pub crux_authority_bump_seed: [u8; 1],

    pub crux_treasury: Pubkey,

    // --------------- Crux fees

    pub crux_fees: CruxFees,

    // --------------- Crux PDA counts

    pub crux_counts: CruxCounts,

}

impl Crux {

    pub fn crux_seeds(&self) -> [&[u8]; 2] {
        [self.crux_authority_seed.as_ref(), &self.crux_authority_bump_seed]
    }

}
