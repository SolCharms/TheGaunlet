use anchor_lang::prelude::*;

use crate::state::{Crux, UserProfile};

#[derive(Accounts)]
#[instruction(bump_user_profile: u8)]
pub struct AddModerator<'info> {

    // Crux and Crux Manager
    #[account(has_one = crux_manager)]
    pub crux: Box<Account<'info, Crux>>,
    pub crux_manager: Signer<'info>,

    /// CHECK: Used for seed verification of user profile pda account
    pub profile_owner: AccountInfo<'info>,

    // The user profile
    #[account(mut, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), profile_owner.key().as_ref()],
              bump = bump_user_profile, has_one = profile_owner, has_one = crux)]
    pub user_profile: Box<Account<'info, UserProfile>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AddModerator>) -> Result<()> {

    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.is_moderator = true;

    msg!("User profile account with address {} is now moderator", ctx.accounts.user_profile.key());
    Ok(())
}
