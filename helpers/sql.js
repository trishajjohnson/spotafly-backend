const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like { firstName: "first_name", age: "age" }
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {firstName: 'Aliya'} =>
 *   { setCols: '"first_name"=$1',
 *     values: ['Aliya'] }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  let keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");
  keys = keys.filter(k => k !== "password");
  
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  let imgUrl = dataToUpdate["img_url"] || dataToUpdate["imgUrl"];
  
  if(!imgUrl) {
    return {
      setCols: `${cols.join(", ")}, "img_url"=$${keys.length + 1}`,
      values: [...Object.values(dataToUpdate).filter(v => v !== dataToUpdate["password"]), "https://i.pinimg.com/474x/65/25/a0/6525a08f1df98a2e3a545fe2ace4be47.jpg"]
    }
  } else {
    return {
      setCols: cols.join(", "),
      values: Object.values(dataToUpdate).filter(v => v !== dataToUpdate["password"])
    }
  }
}

module.exports = { sqlForPartialUpdate };
