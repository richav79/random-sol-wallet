const fs = require('fs');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const bip39 = require('bip39');
const { Keypair } = require('@solana/web3.js');

const connection = new Connection(clusterApiUrl('mainnet-beta'));

function generateSeedPhrase() {
    return bip39.generateMnemonic();
}

async function deriveSolanaWallet(seedPhrase) {
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    return keypair.publicKey.toString();
}

async function checkBalance(walletAddress) {
    try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        return balance;
    } catch (error) {
        console.error(`Error checking balance for ${walletAddress}:`, error);
        return 0;
    }
}

function saveWalletsWithBalance(walletsWithBalance) {
    const filePath = 'wallet-with-balance.txt';
    const content = walletsWithBalance.map(({ address, balance }) => `${address}, Balance: ${balance / 1e9} SOL`).join('\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`Wallets with balance saved to ${filePath}`);
}

async function checkWallets(wallets) {
    const balancePromises = wallets.map(async (wallet) => {
        const balance = await checkBalance(wallet);
        return { address: wallet, balance };
    });
    return await Promise.all(balancePromises);
}

async function main() {
    const numWallets = 10; 
    const wallets = [];


    for (let i = 0; i < numWallets; i++) {
        const seedPhrase = generateSeedPhrase();
        const walletAddress = await deriveSolanaWallet(seedPhrase);
        wallets.push(walletAddress);
    }

    const balances = await checkWallets(wallets);

    const walletsWithBalance = balances.filter(({ balance }) => balance > 0);
    
    saveWalletsWithBalance(walletsWithBalance);
}

main().catch(error => {
    console.error('Error:', error);
});
