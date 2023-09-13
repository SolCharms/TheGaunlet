use anchor_lang::prelude::*;

use crate::state::{Crux, UserProfile};
use prog_common::{close_account, TrySub};

#[derive(Accounts)]
#[instruction(bump_user_profile: u8)]
pub struct DeleteUserProfile<'info> {

    // Crux
    #[account(mut)]
    pub crux: Box<Account<'info, Crux>>,

    pub profile_owner: Signer<'info>,

    // The user profile
    #[account(mut, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), profile_owner.key().as_ref()],
              bump = bump_user_profile, has_one = profile_owner, has_one = crux)]
    pub user_profile: Box<Account<'info, UserProfile>>,

    /// CHECK:
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DeleteUserProfile>) -> Result<()> {

    // Set the receiver of the lamports to be reclaimed from the rent of the accounts to be closed
    let receiver = &mut ctx.accounts.receiver;

    // Close the user profile state account
    let user_profile_account_info = &mut (*ctx.accounts.user_profile).to_account_info();
    close_account(user_profile_account_info, receiver)?;

    // Decrement profile count in crux's state
    let crux = &mut ctx.accounts.crux;
    crux.crux_counts.profile_count.try_sub_assign(1)?;

    msg!("User profile account with address {} now closed", ctx.accounts.user_profile.key());
    msg!("Crux {} now has {} user profiles", ctx.accounts.crux.key(), ctx.accounts.crux.crux_counts.profile_count);
    Ok(())
}
