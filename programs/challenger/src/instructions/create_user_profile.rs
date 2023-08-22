use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};

use crate::state::{Crux, UserProfile};
use prog_common::{now_ts, TryAdd};

#[derive(Accounts)]
#[instruction(bump_treasury: u8)]
pub struct CreateUserProfile<'info> {

    // Crux
    #[account(mut, has_one = crux_treasury)]
    pub crux: Box<Account<'info, Crux>>,

    /// CHECK:
    #[account(mut, seeds = [b"treasury".as_ref(), crux.key().as_ref()], bump = bump_treasury)]
    pub crux_treasury: AccountInfo<'info>,

    #[account(mut)]
    pub profile_owner: Signer<'info>,

    // The user profile
    #[account(init, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), profile_owner.key().as_ref()],
              bump, payer = profile_owner, space = 8 + std::mem::size_of::<UserProfile>())]
    pub user_profile: Box<Account<'info, UserProfile>>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateUserProfile<'info> {

    fn transfer_payment_ctx(&self, lamports: u64) -> Result<()> {
        invoke(
            &system_instruction::transfer(self.profile_owner.key, self.crux_treasury.key, lamports),
            &[
                self.profile_owner.to_account_info(),
                self.crux_treasury.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )
            .map_err(Into::into)
    }
}

pub fn handler(ctx: Context<CreateUserProfile>) -> Result<()> {

    let now_ts: u64 = now_ts()?;
    let crux_profile_fee = ctx.accounts.crux.crux_fees.profile_fee;

    if crux_profile_fee > 0 {
        ctx.accounts.transfer_payment_ctx(crux_profile_fee)?;
    }

    // Record User Profile's State
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.profile_owner = ctx.accounts.profile_owner.key();
    user_profile.crux = ctx.accounts.crux.key();
    user_profile.profile_created_ts = now_ts;
    user_profile.most_recent_engagement_ts = now_ts;

    user_profile.challenges_submitted = 0;
    user_profile.challenges_completed = 0;
    user_profile.reputation_score = 0;

    // user_profile.nft_pfp_token_mint = ;
    user_profile.is_moderator = false;

    // Increment user profile count in crux state's account
    let crux = &mut ctx.accounts.crux;
    crux.crux_counts.profile_count.try_add_assign(1)?;

    msg!("New user profile created for user with wallet address {}", ctx.accounts.profile_owner.key());
    Ok(())
}
