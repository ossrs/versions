package main

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/tencentyun/scf-go-lib/cloudfunction"
	"github.com/tencentyun/scf-go-lib/events"
)

const stableDocker2 = "v2.0-r9"
const stableVersion2 = "2.0.273"
const stableDocker3 = "v3.0-r6"
const stableVersion3 = "3.0.163"
const stableDocker4 = "v4.0.136"
const stableVersion4 = "v4.0.136"

const dockerImage = "ossrs/srs"
const dockerMirror = "registry.cn-hangzhou.aliyuncs.com/ossrs/srs"

type VersionResponse struct {
	// The matched latest version for client requested.
	MatchVersion      string `json:"match_version"`
	MatchDocker       string `json:"match_docker"`
	MatchDockerImage  string `json:"match_docker_image"`
	MatchDockerMirror string `json:"match_docker_mirror"`
	// The stable latest version, recommend to use.
	StableVersion      string `json:"stable_version"`
	StableDocker       string `json:"stable_docker"`
	StableDockerImage  string `json:"stable_docker_image"`
	StableDockerMirror string `json:"stable_docker_mirror"`
	// The timestamp of request.
	timestamp string `json:"-"`
}

func (v *VersionResponse) String() string {
	return fmt.Sprintf("stable=%v,%v, match=%v%v", v.StableDocker, v.StableVersion, v.MatchDocker, v.MatchVersion)
}

func handler(ctx context.Context, e events.APIGatewayRequest) (*VersionResponse, error) {
	q := url.Values(e.QueryString)
	version, ts := q.Get("version"), q.Get("ts")

	// The recommend version.
	if version == "" {
		version = "v0.0.0"
	}

	// Transform version to vx.x.x
	if !strings.HasPrefix(version, "v") {
		version = "v" + version
	}
	if !strings.Contains(version, ".") {
		version += ".0.0"
	}

	// Build response.
	res := &VersionResponse{
		StableDocker:  stableDocker3,
		StableVersion: stableVersion3,
		timestamp:     ts,
	}

	if strings.HasPrefix(version, "v2.") {
		res.MatchDocker = stableDocker2
		res.MatchVersion = stableVersion2
	} else if strings.HasPrefix(version, "v3.") {
		res.MatchDocker = stableDocker3
		res.MatchVersion = stableVersion3
	} else if strings.HasPrefix(version, "v4.") {
		res.MatchDocker = stableDocker4
		res.MatchVersion = stableVersion4
	} else if strings.HasPrefix(version, "v5.") {
		res.MatchDocker = stableDocker4
		res.MatchVersion = stableVersion4
	} else {
		res.MatchDocker = stableDocker3
		res.MatchVersion = stableVersion3
	}
	res.MatchDockerImage = fmt.Sprintf("%v:%v", dockerImage, res.MatchDocker)
	res.MatchDockerMirror = fmt.Sprintf("%v:%v", dockerMirror, res.MatchDocker)
	res.StableDockerImage = fmt.Sprintf("%v:%v", dockerImage, res.StableDocker)
	res.StableDockerMirror = fmt.Sprintf("%v:%v", dockerMirror, res.StableDocker)

	headers := make(http.Header)
	for k, v := range e.Headers {
		for _, value := range strings.Split(v, ",") {
			headers.Add(k, value)
		}
	}

	q.Set("rip", headers.Get("X-Forwarded-For"))
	fmt.Printf("SRS id=%v, version=%v, eip=%v, rip=%v, res=(%v), REGION=%v by %v\n", q.Get("id"), version, q.Get("eip"), q.Get("rip"), res, os.Getenv("REGION"), e)

	if err := writeMySQL(q, res); err != nil {
		return nil, err
	}

	return res, nil
}

var mysqlOnce sync.Once

func writeMySQL(q url.Values, res *VersionResponse) error {
	// Create db and tables if not exists.
	var err error
	mysqlOnce.Do(func() {
		err = mysqlInit()
	})
	if err != nil {
		return err
	}

	// Ignore if empty id.
	if q.Get("id") == "" {
		return nil
	}

	// Connect to MySQL DB.
	db, err := sql.Open("mysql", mysqlURLWithDB())
	if err != nil {
		return err
	}
	defer db.Close()

	// Get the id if not exists.
	exists, err := db.Query("SELECT id from versions WHERE id=?", q.Get("id"))
	if err != nil {
		return err
	}

	// Create the SRS server information if not exists.
	if !exists.Next() {
		if _, err = db.Exec("INSERT INTO versions(id) VALUES(?)", q.Get("id")); err != nil {
			return err
		}
	}

	// Update the SRS server information.
	if _, err = db.Exec(`
		UPDATE 
			versions 
		SET 
			id=?, version=?, ts=?, eip=?, rip=?, 
			match_version=?, stable_version=? 
		WHERE 
			id=?
		`,
		q.Get("id"), q.Get("version"), q.Get("ts"), q.Get("eip"), q.Get("rip"),
		res.MatchVersion, res.StableVersion,
		q.Get("id"),
	); err != nil {
		return err
	}

	return nil
}

func mysqlInit() error {
	db, err := sql.Open("mysql", mysqlURLNoDB())
	if err != nil {
		return err
	}
	defer db.Close()

	if _, err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %v", os.Getenv("MYSQL_DB"))); err != nil {
		return err
	}

	if _, err = db.Exec(fmt.Sprintf("USE %v", os.Getenv("MYSQL_DB"))); err != nil {
		return err
	}

	// @see https://blog.csdn.net/weter_drop/article/details/89924451
	if _, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS versions (
			id varchar(64) NOT NULL COMMENT "SRS server id",
			version varchar(16) DEFAULT NULL COMMENT "SRS server current version",
			match_version varchar(16) DEFAULT NULL COMMENT "SRS server matched version",
			stable_version varchar(16) DEFAULT NULL COMMENT "SRS server stable version",
			eip varchar(256) DEFAULT NULL COMMENT "SRS local eip(public ip), by SRS",
			rip varchar(256) DEFAULT NULL COMMENT "SRS real eip(internet ip), by SCF",
			ts varchar(32) DEFAULT NULL COMMENT "SRS server current timestamp",
			create_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT "Create datetime",
			update_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "Last update datetime",
			PRIMARY KEY (id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8
	`); err != nil {
		return err
	}

	fmt.Printf("init db %v ok\n", mysqlURLWithDB())

	return nil
}

func mysqlURLNoDB() string {
	return fmt.Sprintf("root:%v@tcp(%v:%v)/",
		os.Getenv("MYSQL_PASSWORD"), os.Getenv("MYSQL_HOST"), os.Getenv("MYSQL_PORT"),
	)
}

func mysqlURLWithDB() string {
	return fmt.Sprintf("root:%v@tcp(%v:%v)/%v?charset=utf8",
		os.Getenv("MYSQL_PASSWORD"), os.Getenv("MYSQL_HOST"), os.Getenv("MYSQL_PORT"), os.Getenv("MYSQL_DB"),
	)
}

func main() {
	cloudfunction.Start(handler)
}
