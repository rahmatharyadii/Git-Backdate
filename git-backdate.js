const { exec } = require("child_process");
const fs = require("fs");
const readline = require("readline");

// Fungsi untuk menjalankan perintah shell
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Fungsi untuk membuat array tanggal dari rentang startDate ke endDate
function generateDates(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) { // Hindari Sabtu dan Minggu
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
}

// Fungsi untuk memformat tanggal ke format ISO
function formatDate(date) {
  return date.toISOString().split(".")[0]; // Menghilangkan milidetik
}

// Fungsi untuk menghasilkan jumlah commit acak per hari
function generateRandomCommitCount() {
  return Math.floor(Math.random() * 26) + 5; // Random antara 5 hingga 30
}

// Fungsi untuk membuat commit di satu hari
async function createCommitsForDay(date, commitCount) {
  for (let i = 0; i < commitCount; i++) {
    const commitDate = new Date(date);
    commitDate.setSeconds(commitDate.getSeconds() + i); // Tambahkan detik untuk setiap commit
    const formattedDate = formatDate(commitDate);

    // Buat file sementara untuk commit
    const filename = `temp-file-${commitDate.getTime()}.txt`;
    fs.writeFileSync(filename, `Commit dibuat pada: ${formattedDate}`, "utf8");

    // Tambahkan ke staging dan commit
    await runCommand(`git add ${filename}`);
    await runCommand(
      `GIT_AUTHOR_DATE="${formattedDate}" GIT_COMMITTER_DATE="${formattedDate}" git commit -m "Commit pada ${formattedDate}"`
    );

    // Hapus file sementara
    fs.unlinkSync(filename);
  }
}

// Fungsi utama
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Masukkan start date (YYYY-MM-DD): ", async (startInput) => {
    rl.question("Masukkan end date (YYYY-MM-DD): ", async (endInput) => {
      try {
        const startDate = new Date(startInput);
        const endDate = new Date(endInput);

        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
          throw new Error("Tanggal tidak valid. Pastikan format dan urutan benar.");
        }

        const dates = generateDates(startDate, endDate);
        console.log(`Tanggal yang diproses: ${dates.map((d) => d.toISOString().split("T")[0])}`);

        for (const date of dates) {
          const commitCount = generateRandomCommitCount();
          console.log(`Membuat ${commitCount} commit pada ${date.toISOString().split("T")[0]}`);
          await createCommitsForDay(date, commitCount);
        }

        // Push ke remote
        console.log("Push perubahan ke remote...");
        await runCommand("git push");
        console.log("Selesai. Semua perubahan telah di-push.");
      } catch (error) {
        console.error(`Terjadi kesalahan: ${error.message}`);
      } finally {
        rl.close();
      }
    });
  });
}

// Jalankan program
main();
