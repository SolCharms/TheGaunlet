import { BN } from '@coral-xyz/anchor';
import { CruxFees } from '../../challenger.client';

type CruxConfig = {
    cruxFees: CruxFees
}

export const cruxConfig: CruxConfig =
    {
        cruxFees: {
            profileFee: new BN(10_000), // 0.000,010,0000 Sol
            submissionFee: new BN(5_000), // 5000 Lamports
        }
    }

