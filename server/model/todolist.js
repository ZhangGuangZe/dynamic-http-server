async function getList(database, userInfo) {
  const result = await database.all(`SELECT * FROM todo WHERE state <> 2 and userid = ${userInfo.id} ORDER BY state DESC`);
  return result;
}

async function addTask(database, userInfo, { text, state }) {
  try {
    const data = await database.run('INSERT INTO todo(text,state,userid) VALUES (?, ?, ?)', text, state, userInfo.id);
    return { err: '', data };
  } catch (e) {
    return { err: e.message };
  }
}

async function updateTask(database, { id, state }) {
  try {
    const data = await database.run('UPDATE todo SET state = ? WHERE id = ?', state, id);
    return { err: '', data };
  } catch (e) {
    return { err: e.message };
  }
}

async function deleteTask(database, { id }) {
  try {
    const data = await database.run('DELETE todo WHERE id = ?', id);
    return { err: '', data };
  } catch (e) {
    return { err: e.message };
  }
}

module.exports = {
  getList,
  addTask,
  updateTask,
  deleteTask
};