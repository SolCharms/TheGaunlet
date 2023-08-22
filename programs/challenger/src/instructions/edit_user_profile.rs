use anchor_lang::prelude::*;
use anchor_spl::token::{Mint};

use crate::state::{Crux, UserProfile};
use prog_common::{now_ts};

#[derive(Accounts)]
#[instruction(bump_user_profile: u8)]
pub struct EditUserProfile<'info> {

    // Crux
    pub crux: Box<Account<'info, Crux>>,

    pub profile_owner: Signer<'info>,

    // The user profile
    #[account(mut, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), profile_owner.key().as_ref()],
              bump = bump_user_profile, has_one = profile_owner, has_one = crux)]
    pub user_profile: Box<Account<'info, UserProfile>>,

    // NFT token mint address to be set as PFP
    pub nft_pfp_token_mint: Box<Account<'info, Mint>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EditUserProfile>) -> Result<()> {

    let now_ts: u64 = now_ts()?;

    // Update user profile account's pfp and most recent engagement timestamp
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.nft_pfp_token_mint = ctx.accounts.nft_pfp_token_mint.key();
    user_profile.most_recent_engagement_ts = now_ts;

    msg!("NFT PFP of user profile {} updated to token mint with account address {}",
         ctx.accounts.user_profile.key(), ctx.accounts.nft_pfp_token_mint.key());
    Ok(())
}
