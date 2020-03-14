<?php
/*
Plugin Name:  MemberPress Pro Reports by @scriptmastership
Description:  Pro Reports for MemberPress Plugin
Plugin URI:   https://scriptmastership.com
Author:       @scriptmastership
Version:      0.1.1
Text Domain:  memberpress-pro-reports
Domain Path:  /languages
License:      GPL v2 or later
License URI:  https://www.gnu.org/licenses/gpl-2.0.txt
*/



// disable direct file access
if ( ! defined( 'ABSPATH' ) ) {

	exit;

}



// include plugin dependencies
require_once plugin_dir_path( __FILE__ ) . 'admin/menu.php';
require_once plugin_dir_path( __FILE__ ) . 'admin/view.php';
require_once plugin_dir_path( __FILE__ ) . 'admin/resources.php';
require_once plugin_dir_path( __FILE__ ) . 'admin/controller.php';