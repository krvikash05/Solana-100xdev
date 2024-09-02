import React, { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';

const SolanaWalletTracker = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Use devnet for testing
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const pubKey = new PublicKey(walletAddress);

      // Verify the public key is valid
      if (!PublicKey.isOnCurve(pubKey.toBuffer())) {
        throw new Error('Invalid public key');
      }

      const transactions = await connection.getSignaturesForAddress(pubKey, { limit: 10 });

      if (transactions.length === 0) {
        setError('No transactions found for this address on devnet. Try airdropping some SOL first.');
        setLoading(false);
        return;
      }

      const transactionDetails = await Promise.all(
        transactions.map(async (tx) => {
          const txInfo = await connection.getTransaction(tx.signature);
          return {
            signature: tx.signature,
            blockTime: txInfo?.blockTime ? new Date(txInfo.blockTime * 1000).toLocaleString() : 'Unknown',
            amount: txInfo?.meta ? (txInfo.meta.postBalances[0] - txInfo.meta.preBalances[0]) / 1e9 : 0,
          };
        })
      );

      setTransactions(transactionDetails);
    } catch (err) {
      console.error('Detailed error:', err);
      if (err.message.includes('Invalid public key')) {
        setError('Invalid wallet address. Please check and try again.');
      } else if (err.message.includes('429 Too Many Requests')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError(`Error fetching transactions: ${err.message}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Solana Wallet Tracker (Devnet)</h1>
      <div className="mb-4">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter Solana wallet address"
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        onClick={fetchTransactions}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Loading...' : 'Fetch Transactions'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {transactions.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Recent Transactions</h2>
          <ul>
            {transactions.map((tx) => (
              <li key={tx.signature} className="border-b py-2">
                <p>Signature: {tx.signature}</p>
                <p>Time: {tx.blockTime}</p>
                <p>Amount: {tx.amount.toFixed(9)} SOL</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SolanaWalletTracker;