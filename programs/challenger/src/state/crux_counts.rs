use anchor_lang::prelude::*;

#[proc_macros::assert_size(24)] // divisible by 8
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CruxCounts {

    pub profile_count: u64,

    pub challenge_count: u64,

    pub submission_count: u64,

}
