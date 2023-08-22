use anchor_lang::prelude::*;

use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction;

use crate::state::{Challenge, Crux, Tags, UserProfile};
use prog_common::{now_ts, TrySub, errors::ErrorCode};

#[derive(Accounts)]
#[instruction(bump_moderator_profile: u8, bump_challenge: u8)]
pub struct EditChallenge<'info> {

    // Crux
    pub crux: Box<Account<'info, Crux>>,

    #[account(mut)]
    pub moderator: Signer<'info>,

    // The moderator profile
    #[account(mut, seeds = [b"user_profile".as_ref(), crux.key().as_ref(), moderator.key().as_ref()],
              bump = bump_moderator_profile, has_one = crux, constraint = moderator_profile.profile_owner == moderator.key())]
    pub moderator_profile: Box<Account<'info, UserProfile>>,

    // Challenge PDA account and seed
    #[account(mut, seeds = [b"challenge".as_ref(), crux.key().as_ref(), challenge_seed.key().as_ref()],
              bump = bump_challenge, has_one = crux, has_one = challenge_seed)]
    pub challenge: Box<Account<'info, Challenge>>,

    /// CHECK: The seed address used for initialization of the challenge PDA
    pub challenge_seed: AccountInfo<'info>,

    /// CHECK:
    // The new content data hash of the challenge struct
    pub new_content_data_hash: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> EditChallenge<'info> {
    fn pay_lamports_difference(&self, lamports: u64) -> Result<()> {
        invoke(
            &system_instruction::transfer(self.moderator.key, &self.challenge.key(), lamports),
            &[
                self.moderator.to_account_info(),
                self.challenge.to_account_info(),
                self.system_program.to_account_info(),
            ],
        )
            .map_err(Into::into)
    }
}

pub fn handler(ctx: Context<EditChallenge>, new_title: String, new_content_data_url: String, new_tags: Vec<Tags>, new_challenge_expires_ts: u64, new_reputation: u64) -> Result<()> {

    let now_ts: u64 = now_ts()?;

    if !ctx.accounts.moderator_profile.is_moderator {
        return Err(error!(ErrorCode::ProfileIsNotModerator));
    }

    let title_length = new_title.len();
    let content_data_url_length = new_content_data_url.len();

    // Ensure that the length of the new title and content data url strings are non-zero
    if (title_length == 0) || (content_data_url_length == 0) {
        return Err(error!(ErrorCode::InvalidStringInput));
    }

    // Ensure that the new title and content data url strings do not exceed 256 characters
    if (title_length > 256) || (content_data_url_length > 256) {
        return Err(error!(ErrorCode::TitleOrUrlTooLong));
    }

    // Ensure new challenge expires timestamp is greater than now timestamp
    if !(new_challenge_expires_ts > now_ts) {
        return Err(error!(ErrorCode::InvalidExpiryTs));
    }

    // Calculate data sizes and convert data to slice arrays
    let mut tag_buffer: Vec<u8> = Vec::new();
    new_tags.serialize(&mut tag_buffer).unwrap();

    let tag_buffer_as_slice: &[u8] = tag_buffer.as_slice();
    let tag_buffer_slice_length: usize = tag_buffer_as_slice.len();

    let mut title_buffer: Vec<u8> = Vec::new();
    new_title.serialize(&mut title_buffer).unwrap();

    let title_buffer_as_slice: &[u8] = title_buffer.as_slice();
    let title_buffer_slice_length: usize = title_buffer_as_slice.len();

    let mut content_data_url_buffer: Vec<u8> = Vec::new();
    new_content_data_url.serialize(&mut content_data_url_buffer).unwrap();

    let content_data_url_buffer_as_slice: &[u8] = content_data_url_buffer.as_slice();
    let content_data_url_buffer_slice_length: usize = content_data_url_buffer_as_slice.len();

    // Calculate total space required for the addition of the new data
    let new_data_bytes_amount: usize = 96 + tag_buffer_slice_length + title_buffer_slice_length + content_data_url_buffer_slice_length + 32;
    let old_data_bytes_amount: usize = ctx.accounts.challenge.to_account_info().data_len();

    if new_data_bytes_amount > old_data_bytes_amount {

        let minimum_balance_for_rent_exemption: u64 = Rent::get()?.minimum_balance(new_data_bytes_amount);
        let lamports_difference: u64 = minimum_balance_for_rent_exemption.try_sub(ctx.accounts.challenge.to_account_info().lamports())?;

        // Transfer the required difference in Lamports to accommodate this increase in space
        ctx.accounts.pay_lamports_difference(lamports_difference)?;

        // Reallocate the challenge pda account with the proper byte data size
        ctx.accounts.challenge.to_account_info().realloc(new_data_bytes_amount, false)?;
    }

    // Update challenge account's state
    let challenge = &mut ctx.accounts.challenge;
    challenge.challenge_expires_ts = new_challenge_expires_ts;
    challenge.reputation = new_reputation;
    challenge.tags = new_tags;
    challenge.title = new_title;
    challenge.content_data_url = new_content_data_url;
    challenge.content_data_hash = ctx.accounts.new_content_data_hash.key();

    // Update the moderator profile's state account
    let moderator_profile = &mut ctx.accounts.moderator_profile;
    moderator_profile.most_recent_engagement_ts = now_ts;

    msg!("Challenge PDA account with address {} has been edited", ctx.accounts.challenge.key());
    Ok(())
}
