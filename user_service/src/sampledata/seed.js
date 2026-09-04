import mongoose from "mongoose";
import Post from "../model/Post.model.js";
import User from "../model/User.model.js";
import bcrypt  from "bcrypt";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { CONTEST_START_DATE } from "../config/contest.js";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });



function dayOffset(n) {
  const d = new Date(CONTEST_START_DATE);
  d.setDate(d.getDate() + n);
  return d;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await Post.deleteMany({});

  const hashedPw = await bcrypt.hash('password123', 10);


  const users = await User.insertMany([
    { name: 'multi_cat_leader', email: 'a@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'tie_score_a',      email: 'b@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'tie_score_b',      email: 'c@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'missed_week4',     email: 'd@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'ineligible_user',  email: 'e@test.com', password: hashedPw, residency: 'Maharashtra' }, 
    { name: 'kyc_fail_winner',  email: 'f@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'kyc_next_up',      email: 'g@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'category2_only',   email: 'h@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'filler_user_1',    email: 'i@test.com', password: hashedPw, residency: 'Chhattisgarh' },
    { name: 'filler_user_2',    email: 'j@test.com', password: hashedPw, residency: 'Chhattisgarh' }
  ]);

  const byName = Object.fromEntries(users.map(u => [u.name, u]));
  const media = { url: '/uploads/seed/dummy.jpg', type: 'image', mimeType: 'image/jpeg', size: 1000 };

  const posts = [];

  
  posts.push(
    { creator: byName.multi_cat_leader._id, category: 'Music', caption: 'best music', media,
      counts: { likes: 100, comments: 20, views: 500 }, score: 100*1 + 20*3 + 500*0.2, createdAt: dayOffset(1) },
    { creator: byName.multi_cat_leader._id, category: 'Dance', caption: 'best dance', media,
      counts: { likes: 90, comments: 18, views: 480 }, score: 90*1 + 18*3 + 480*0.2, createdAt: dayOffset(2) }
  );
  
  posts.push(
    { creator: byName.filler_user_1._id, category: 'Music', caption: 'runner up music', media,
      counts: { likes: 50, comments: 10, views: 200 }, score: 50*1 + 10*3 + 200*0.2, createdAt: dayOffset(1) },
    { creator: byName.filler_user_2._id, category: 'Dance', caption: 'runner up dance', media,
      counts: { likes: 45, comments: 9, views: 180 }, score: 45*1 + 9*3 + 180*0.2, createdAt: dayOffset(2) }
  );


  posts.push(
    { creator: byName.tie_score_a._id, category: 'Comedy', caption: 'tie A', media,
      counts: { likes: 30, comments: 5, views: 100 }, score: 30*1 + 5*3 + 100*0.2, createdAt: dayOffset(3) }, // earlier
    { creator: byName.tie_score_b._id, category: 'Comedy', caption: 'tie B', media,
      counts: { likes: 30, comments: 5, views: 100 }, score: 30*1 + 5*3 + 100*0.2, createdAt: dayOffset(4) }  // later — should lose tie
  );


  for (let week = 0; week < 3; week++) {
    for (let i = 0; i < 3; i++) {
      posts.push({
        creator: byName.missed_week4._id, category: 'Sports', caption: `w${week+1}p${i+1}`, media,
        counts: { likes: 10, comments: 2, views: 50 }, score: 10 + 6 + 10,
        createdAt: dayOffset(week * 7 + i)
      });
    }
  }

  posts.push(
    { creator: byName.missed_week4._id, category: 'Sports', caption: 'w4p1', media,
      counts: { likes: 10, comments: 2, views: 50 }, score: 26, createdAt: dayOffset(21) },
    { creator: byName.missed_week4._id, category: 'Sports', caption: 'w4p2', media,
      counts: { likes: 10, comments: 2, views: 50 }, score: 26, createdAt: dayOffset(22) }
  );

 
  posts.push(
    { creator: byName.ineligible_user._id, category: 'Tech', caption: 'huge score but ineligible', media,
      counts: { likes: 1000, comments: 200, views: 5000 }, score: 1000 + 600 + 1000, createdAt: dayOffset(1) }
  );

 
  posts.push(
    { creator: byName.category2_only._id, category: 'Fashion', caption: 'only fashion post', media,
      counts: { likes: 20, comments: 3, views: 80 }, score: 20 + 9 + 16, createdAt: dayOffset(1) }
  );
  

  
  posts.push(
    { creator: byName.kyc_fail_winner._id, category: 'Travel', caption: 'top travel', media,
      counts: { likes: 60, comments: 12, views: 300 }, score: 60 + 36 + 60, createdAt: dayOffset(1) },
    { creator: byName.kyc_next_up._id, category: 'Travel', caption: 'second travel', media,
      counts: { likes: 55, comments: 11, views: 280 }, score: 55 + 33 + 56, createdAt: dayOffset(2) }
  );

  await Post.insertMany(posts);

  console.log(`Seeded ${users.length} users and ${posts.length} posts.`);
  console.log('User IDs for reference:');
  for (const u of users) console.log(`  ${u.name}: ${u._id}`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});