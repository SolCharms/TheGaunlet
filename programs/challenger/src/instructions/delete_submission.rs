use anchor_lang::prelude::*;

use crate::state::{Challenge, Crux, Submission, SubmissionState, UserProfile};
use prog_common::{now_ts, close_account, TrySub, errors::ErrorCode};

#[derive(Accounts)]
#[instruction(bump_user_profile: u8, bump_challenge: u8, bump_submission: u8)]
pub struct DeleteSubmission<'info> {

    // Crux
    #[account(mut)]
    pub crux: Box<Account<'info, Crux>>,

    pub profile_owner: Signer<'info>,

    // The user profile
    #[account(mut, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), profile_owner.key().as_ref()],
              bump = bump_user_profile, has_one = crux, has_one = profile_owner)]
    pub user_profile: Box<Account<'info, UserProfile>>,

    // Challenge PDA account and seed
    #[account(seeds = [b"challenge".as_ref(), crux.key().as_ref(), challenge_seed.key().as_ref()],
              bump = bump_challenge, has_one = crux, has_one = challenge_seed)]
    pub challenge: Box<Account<'info, Challenge>>,

    /// CHECK: The seed address used for initialization of the challenge PDA
    pub challenge_seed: AccountInfo<'info>,

    #[account(mut, seeds = [b"submission".as_ref(), challenge.key().as_ref(), user_profile.key().as_ref()],
              bump = bump_submission, has_one = challenge, has_one = user_profile)]
    pub submission: Box<Account<'info, Submission>>,

    /// CHECK:
    #[account(mut)]
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DeleteSubmission>) -> Result<()> {

    let now_ts: u64 = now_ts()?;

    let is_completed_challenge = ctx.accounts.submission.submission_state;

    // Ensure submission is not an accepted submission
    if is_completed_challenge == SubmissionState::Completed {
        return Err(error!(ErrorCode::AccountCannotBeEdited));
    }

    // Set the receiver of the lamports to be reclaimed from the rent of the accounts to be closed
    let receiver = &mut ctx.accounts.receiver;

    // Close the submission state account
    let submission_account_info = &mut (*ctx.accounts.submission).to_account_info();
    close_account(submission_account_info, receiver)?;

    // Decrement submission count in crux's state
    let crux = &mut ctx.accounts.crux;
    crux.crux_counts.submission_count.try_sub_assign(1)?;

    // Decrement submission count in user profile's state
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.challenges_submitted.try_sub_assign(1)?;

    // Update user profile's most recent engagement ts
    user_profile.most_recent_engagement_ts = now_ts;

    msg!("Submission PDA account with address {} now closed", ctx.accounts.challenge.key());
    Ok(())
}
