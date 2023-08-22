use anchor_lang::prelude::*;

#[proc_macros::assert_size(16)] // divisible by 8
#[repr(C)]
#[derive(Debug, Copy, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CruxFees {

    pub profile_fee: u64,

    pub submission_fee: u64,
}
