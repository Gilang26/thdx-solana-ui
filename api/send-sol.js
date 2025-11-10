// api/send-sol.js
import { Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    let { to, amount } = req.body;

    // 🧹 Bersihkan input dari spasi tak terlihat
    to = (to || "").toString().replace(/\s+/g, "").trim();
    amount = parseFloat(amount);

    if (!to || isNaN(amount)) {
      return res.status(400).json({ error: "Alamat & jumlah wajib diisi" });
    }

    // ✅ Validasi alamat Solana (43–44 karakter base58)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(to)) {
      return res.status(400).json({ error: "Alamat penerima tidak valid" });
    }

    // 🔑 Ambil private key burn wallet dari env Vercel
    const secretKeyJson = process.env.PRIVATE_KEY_JSON;
    if (!secretKeyJson) {
      return res.status(500).json({ error: "PRIVATE_KEY_JSON belum diset di Environment Variables" });
    }

    const secretKey = Uint8Array.from(JSON.parse(secretKeyJson));
    const from = Keypair.fromSecretKey(secretKey);

    // 🔗 Hubungkan ke Solana Mainnet
    const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

    // 💸 Buat transaksi transfer SOL
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );

    // 🚀 Kirim transaksi
    const signature = await sendAndConfirmTransaction(connection, tx, [from]);

    return res.status(200).json({
      success: true,
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=mainnet-beta`
    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
