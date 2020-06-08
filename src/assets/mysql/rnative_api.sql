create database rnative_commerce;
use rnative_commerce;

create table users(
	id int auto_increment primary key,
    username varchar(30) not null unique,
    name varchar(50) not null,
    email varchar(30) not null unique,
    password varchar(200) not null,
    avatar varchar(40)
);

create table tokens(
	id int auto_increment primary key,
    user_id int not null,
    token varchar(200) not null,
    CONSTRAINT FK_UserId FOREIGN KEY (user_id) references users(id)
);
