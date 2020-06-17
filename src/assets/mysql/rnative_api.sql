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

create table products(
	id int auto_increment primary key,
    user_id int,
    name varchar(30),
    picture varchar(100),
    description varchar(500),
    stock int ,
    price int,
    created_at datetime default now(),
    updated_at datetime default now() on update now(),
    constraint FK_ProductUserId foreign key (user_id) references users(id) on delete cascade on update cascade
);

create table carts(
	id int auto_increment primary key,
	user_id int not null,
	product_id int not null,
    name varchar(100) not null,
    qty int,
    price int,
    total_amount int,
	constraint FK_CartUserId FOREIGN KEY (user_id) REFERENCES users(id)
	ON DELETE CASCADE ON UPDATE CASCADE,
	constraint FK_CartProductId FOREIGN KEY (product_id) REFERENCES products(id)
	ON DELETE CASCADE ON UPDATE CASCADE
	
);

create table transactions(
	id int auto_increment primary key,
	user_id int ,
	total_amount int,
	created_at datetime not null default now(),
	updated_at datetime not null default now() on update now(),
	constraint FK_TrxUserId foreign key (user_id) references users(id) on update cascade on delete set null
);

create table detail_transaction(
	id int auto_increment primary key,
	trx_id int ,
	seller_id int,
	product_id int,
   name varchar(100),
	qty int,
	price int,
	total_amount int,
	created_at datetime not null default now(),
	updated_at datetime not null default now() on update now(),
	constraint FK_TrxDetailTrxId foreign key (trx_id) references transactions(id) on update cascade on delete set null,
	constraint FK_TrxDetailProductId foreign key (product_id) references products(id) on update cascade on delete set null,
	constraint FK_TrxDetailSellerId foreign key (seller_id) references users(id) on update cascade on delete set null
);


drop table carts;
drop table transactions;