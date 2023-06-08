const mysql = require('mysql2/promise');
const SQL = require('sql-template-strings');
const utils = require('./index');
const logger = require('logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'FractureiserHelper'
});

async function addFaqQuestion(question, answer, pattern = null, containsPattern = null, createdBy) {
  // Create the unique ID
  const id = await utils.genRandomId(10);

  // Add the question to the database
  await pool
    .query(SQL`INSERT INTO faq (id, question, answer, pattern, containsPattern, createdBy) VALUES (${id}, ${question}, ${answer}, ${pattern}, ${containsPattern}, ${createdBy})`)
    .catch((err) => {
      logger.error(err);
      throw err;
    });

  // Return the ID
  return id;
}

async function editFaqQuestion(id, question, answer, pattern = null, containsPattern = null) {
  // Edit the question in the database
  await pool
    .query(SQL`UPDATE faq SET question=${question}, answer=${answer}, pattern=${pattern}, containsPattern=${containsPattern} WHERE id=${id}`)
    .catch((err) => {
      logger.error(err);
      throw err;
    });
}

async function deleteFaqQuestion(id) {
  // Delete the question from the database
  await pool.query(SQL`DELETE FROM faq WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });
}

async function getFaqQuestion(id) {
  // Get the question from the database
  const [rows] = await pool.query(SQL`SELECT * FROM faq WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the question
  return rows[0];
}

async function getFaqQuestions() {
  // Get the questions from the database
  const [rows] = await pool.query(SQL`SELECT * FROM faq`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the questions
  return rows;
}

async function findLikeQuestionOrAnswer(string) {
  const [rows] = await pool
    .query(SQL`SELECT * FROM faq WHERE question LIKE '%' || ${string} || '%' OR answer LIKE '%' || ${string} || '%'`)
    .catch((err) => {
      logger.error(err);
      throw err;
    });

  return rows.length > 0 ? rows : [];
}

// Teams
async function createTeam(name, forumId) {
  // Create the unique ID
  const id = await utils.genRandomId(10);
  const members = JSON.stringify([]);

  // Add the team to the database
  await pool.query(SQL`INSERT INTO teams (id, name, forumId, members) VALUES (${id}, ${name}, ${forumId}, ${members})`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the ID
  return id;
}

async function teamExists(forumId) {
  // Get the team from the database
  const [rows] = await pool.query(SQL`SELECT * FROM teams WHERE forumId=${forumId}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  return rows.length > 0;
}


async function deleteTeam(id) {
  // Delete the team from the database
  await pool.query(SQL`DELETE FROM teams WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });
}

async function getTeam(id) {
  // Get the team from the database
  const [rows] = await pool.query(SQL`SELECT * FROM teams WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the team
  return rows[0];
}

async function getTeamByName(name) {
  // Get the team from the database
  const [rows] = await pool.query(SQL`SELECT * FROM teams WHERE name=${name}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the team
  return rows[0];
}

async function getTeams() {
  // Get the teams from the database
  const [rows] = await pool.query(SQL`SELECT * FROM teams`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the teams
  return rows;
};

async function getTeamLikeName(name) {
  // Get the teams from the database
  const [rows] = await pool.query(SQL`SELECT * FROM teams WHERE name LIKE '%' || ${name} || '%'`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the teams
  return rows;
}

async function addTeamMemeber(id, memberId) {
  // Get the team from the database
  const team = await getTeam(id);
  const members = JSON.parse(team.members);
  
  members.push(memberId);

  // Update the team in the database
  await pool.query(SQL`UPDATE teams SET members=${JSON.stringify(members)} WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the team
  return team;
}

async function removeTeamMemeber(id, memberId) {
  // Get the team from the database
  const team = await getTeam(id);

  // Remove the member from the team
  const members = JSON.parse(team.members);
  const index = members.indexOf(memberId);

  if (index > -1) {
    members.splice(index, 1);
  }

  // Update the team in the database
  await pool.query(SQL`UPDATE teams SET members=${JSON.stringify(members)} WHERE id=${id}`).catch((err) => {
    logger.error(err);
    throw err;
  });

  // Return the team
  return team;
}


module.exports = {
  addFaqQuestion,
  editFaqQuestion,
  deleteFaqQuestion,
  getFaqQuestion,
  getFaqQuestions,
  findLikeQuestionOrAnswer,
  createTeam,
  deleteTeam,
  getTeam,
  getTeamByName,
  getTeams,
  getTeamLikeName,
  addTeamMemeber,
  removeTeamMemeber,
  teamExists
};