use anchor_lang::prelude::*;

use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction;

use crate::state::{Challenge, Crux, Submission, SubmissionState, UserProfile};
use prog_common::{now_ts, TrySub, errors::ErrorCode};

#[derive(Accounts)]
#[instruction(bump_user_profile: u8, bump_challenge: u8, bump_submission: u8)]
pub struct EditSubmission<'info> {

    // Crux
    pub crux: Box<Account<'info, Crux>>,

    #[account(mut)]
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
    // The new content data hash of the submission struct
    pub new_content_data_hash: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> EditSubmission<'info> {
    fn pay_lamports_difference(&self, lamports: u64) -> Result<()> {
        invoke(
            &system_instruction::transfer(self.profile_owner.key, &self.submission.key(), lamports),
            &[
                self.profile_owner.to_account_info(),
                self.submission.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )
            .map_err(Into::into)
    }
}

pub fn handler(ctx: Context<EditSubmission>, new_content_data_url: String) -> Result<()> {

    let now_ts: u64 = now_ts()?;
    let submission_state = SubmissionState::Pending;

    let content_data_url_length = new_content_data_url.len();

    // Ensure that the length of the new content data url string is non-zero
    if content_data_url_length == 0 {
        return Err(error!(ErrorCode::InvalidStringInput));
    }

    // Ensure that the new content data url string does not exceed 256 characters
    if content_data_url_length > 256 {
        return Err(error!(ErrorCode::TitleOrUrlTooLong));
    }

    // Ensure challenge has not expired
    let challenge_expires_ts = ctx.accounts.challenge.challenge_expires_ts;
    if challenge_expires_ts > now_ts {
        return Err(error!(ErrorCode::ChallengeExpired));
    }

    // Calculate data sizes and convert data to slice arrays
    let mut content_data_url_buffer: Vec<u8> = Vec::new();
    new_content_data_url.serialize(&mut content_data_url_buffer).unwrap();

    let content_data_url_buffer_as_slice: &[u8] = content_data_url_buffer.as_slice();
    let content_data_url_buffer_slice_length: usize = content_data_url_buffer_as_slice.len();

    let mut submission_state_buffer: Vec<u8> = Vec::new();
    submission_state.serialize(&mut submission_state_buffer).unwrap();

    let submission_state_buffer_as_slice: &[u8] = submission_state_buffer.as_slice();
    let submission_state_buffer_slice_length: usize = submission_state_buffer_as_slice.len();

    // Calculate total space required for the addition of the new data
    let new_data_bytes_amount: usize = 88 + content_data_url_buffer_slice_length + 32 + submission_state_buffer_slice_length;
    let old_data_bytes_amount: usize = ctx.accounts.submission.to_account_info().data_len();

    if new_data_bytes_amount > old_data_bytes_amount {

        let minimum_balance_for_rent_exemption: u64 = Rent::get()?.minimum_balance(new_data_bytes_amount);
        let lamports_difference: u64 = minimum_balance_for_rent_exemption.try_sub(ctx.accounts.challenge.to_account_info().lamports())?;

        // Transfer the required difference in Lamports to accommodate this increase in space
        ctx.accounts.pay_lamports_difference(lamports_difference)?;

        // Reallocate the submission pda account with the proper byte data size
        ctx.accounts.submission.to_account_info().realloc(new_data_bytes_amount, false)?;
    }

    // Update submission account's state
    let submission = &mut ctx.accounts.submission;
    submission.most_recent_engagement_ts = now_ts;
    submission.content_data_url = new_content_data_url;
    submission.content_data_hash = ctx.accounts.new_content_data_hash.key();
    submission.submission_state = submission_state;

    // Update user profile's most recent engagement ts
    let user_profile = &mut ctx.accounts.user_profile;
    user_profile.most_recent_engagement_ts = now_ts;

    msg!("Submission PDA account with address {} has been edited", ctx.accounts.submission.key());
    Ok(())
}
