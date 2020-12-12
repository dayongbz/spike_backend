DROP TABLE Users;

DROP TABLE Contacts;

DROP TABLE EmailVerify;

CREATE TABLE Users
(
  nickname VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  pwd_salt VARCHAR(100) NOT NULL,
  address VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  keystore VARCHAR(255) NOT NULL,
  keystore_salt VARCHAR(100) NOT NULL,
  PRIMARY KEY(nickname)
);


CREATE TABLE Contacts
(
  nickname VARCHAR(20) NOT NULL,
  address VARCHAR(100) NOT NULL,
  friend_nickname VARCHAR(20) NOT NULL,
  PRIMARY KEY(nickname),
  FOREIGN KEY(nickname) REFERENCES Users(nickname) ON DELETE CASCADE,
  FOREIGN KEY(friend_nickname) REFERENCES Users(nickname) ON DELETE CASCADE
);

CREATE TABLE Emailverify
(
  id int IDENTITY(0,1) NOT NULL,
  email VARCHAR(100) NOT NULL,
  verify int DEFAULT 0 NOT NULL,
  code VARCHAR(100) NOT NULL,
  PRIMARY KEY(id)
);

SELECT *
FROM Users;

SELECT *
FROM Emailverify;

UPDATE Users SET password = 'dsa', pwd_salt = 'dasf'  WHERE nickname = 'dayong' AND password = 'cb149d947305d8e2f148979d0567e7b62308a5445e1c38fe5a63ae039ac7ff92';