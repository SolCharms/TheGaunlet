type NetworkConfig = {
    clusterApiUrl: string,
    signerKeypair: string
}

export const networkConfig: NetworkConfig =
    {
        clusterApiUrl: "https://api.devnet.solana.com",
        // signerKeypair: "/home/charalambos/.config/solana/devnet-challenger/crux_manager.json" // Crux Manager Account
        // signerKeypair: "/home/charalambos/.config/solana/devnet-challenger/moderator_1.json" // Moderator 1 Account
        signerKeypair: "/home/charalambos/.config/solana/devnet-challenger/user_1.json" // User 1 Account
        // signerKeypair: "/home/charalambos/.config/solana/devnet-test1.json" // Deploy Keypair
    }
